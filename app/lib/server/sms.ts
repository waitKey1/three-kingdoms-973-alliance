import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import DysmsClient, { SendSmsRequest } from "@alicloud/dysmsapi20170525";
import { $OpenApiUtil } from "@alicloud/openapi-core";
import { prisma } from "./prisma";
import { getRedis } from "./redis";
import { ApiError } from "./http";

type SmsPurpose = "LOGIN" | "SETUP";
type StoredCode = { digest: string; attempts: number; purpose: SmsPurpose };

function requiredSecret(name: "SMS_CODE_SECRET" | "BOOTSTRAP_TOKEN") {
  const value = process.env[name];
  if (!value || value.length < 16) throw new ApiError(503, `${name} 尚未正确配置`, "CONFIGURATION_ERROR");
  return value;
}

function digestCode(phone: string, code: string, purpose: SmsPurpose) {
  return createHmac("sha256", requiredSecret("SMS_CODE_SECRET")).update(`${phone}:${code}:${purpose}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function bootstrapAvailable() {
  const [users, setting] = await Promise.all([
    prisma.user.count(),
    prisma.systemSetting.findUnique({ where: { key: "bootstrap" } }),
  ]);
  const value = setting?.value as { completed?: boolean } | null;
  return users === 0 && value?.completed !== true;
}

export async function validateBootstrapToken(token?: string) {
  if (!await bootstrapAvailable()) throw new ApiError(410, "初始化入口已永久关闭", "SETUP_CLOSED");
  if (!token || !safeEqual(token, requiredSecret("BOOTSTRAP_TOKEN"))) {
    throw new ApiError(403, "初始化令牌无效", "INVALID_BOOTSTRAP_TOKEN");
  }
}

async function hitLimit(key: string, limit: number, ttlSeconds: number) {
  const redis = await getRedis();
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, ttlSeconds);
  if (count > limit) throw new ApiError(429, "请求过于频繁，请稍后再试", "RATE_LIMITED");
}

async function deliverSms(phone: string, code: string) {
  if (process.env.NODE_ENV !== "production" && process.env.SMS_DEV_CODE) return;
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME;
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE;
  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new ApiError(503, "短信服务尚未配置", "SMS_NOT_CONFIGURED");
  }
  const config = new $OpenApiUtil.Config({ accessKeyId, accessKeySecret, endpoint: "dysmsapi.aliyuncs.com" });
  const client = new DysmsClient(config);
  const response = await client.sendSms(new SendSmsRequest({
    phoneNumbers: phone,
    signName,
    templateCode,
    templateParam: JSON.stringify({ code }),
  }));
  if (response.body?.code !== "OK") throw new ApiError(502, "短信发送失败，请稍后重试", "SMS_PROVIDER_ERROR");
}

export async function requestSmsCode(input: { phone: string; purpose: SmsPurpose; ip: string; bootstrapToken?: string }) {
  if (input.purpose === "SETUP") await validateBootstrapToken(input.bootstrapToken);
  if (input.purpose === "LOGIN" && await bootstrapAvailable()) {
    throw new ApiError(409, "系统尚未初始化，请先创建首位区管理", "SETUP_REQUIRED");
  }

  const redis = await getRedis();
  const window = Math.floor(Date.now() / 3_600_000);
  const cooldownKey = `sms:cooldown:${input.phone}`;
  const cooldown = await redis.set(cooldownKey, "1", { EX: 60, NX: true });
  if (!cooldown) throw new ApiError(429, "同一手机号60秒内只能发送一次", "PHONE_COOLDOWN");
  try {
    await hitLimit(`sms:phone:${input.phone}:${window}`, 5, 3_700);
    await hitLimit(`sms:ip:${input.ip}:${window}`, 20, 3_700);
    const code = process.env.NODE_ENV !== "production" && process.env.SMS_DEV_CODE
      ? process.env.SMS_DEV_CODE
      : randomInt(0, 1_000_000).toString().padStart(6, "0");
    await deliverSms(input.phone, code);
    const stored: StoredCode = { digest: digestCode(input.phone, code, input.purpose), attempts: 0, purpose: input.purpose };
    await redis.set(`sms:code:${input.phone}:${input.purpose}`, JSON.stringify(stored), { EX: 300 });
    return { expiresIn: 300, cooldown: 60, devMode: process.env.NODE_ENV !== "production" && Boolean(process.env.SMS_DEV_CODE) };
  } catch (error) {
    await redis.del(cooldownKey);
    throw error;
  }
}

export async function verifySmsCode(phone: string, code: string, purpose: SmsPurpose) {
  const redis = await getRedis();
  const key = `sms:code:${phone}:${purpose}`;
  const raw = await redis.get(key);
  if (!raw) throw new ApiError(400, "验证码已过期，请重新获取", "CODE_EXPIRED");
  const stored = JSON.parse(raw) as StoredCode;
  if (!safeEqual(stored.digest, digestCode(phone, code, purpose))) {
    stored.attempts += 1;
    if (stored.attempts >= 5) await redis.del(key);
    else {
      const ttl = await redis.ttl(key);
      await redis.set(key, JSON.stringify(stored), { EX: Math.max(ttl, 1) });
    }
    throw new ApiError(400, stored.attempts >= 5 ? "验证码错误次数过多，请重新获取" : "验证码不正确", "INVALID_CODE");
  }
  await redis.del(key);
}
