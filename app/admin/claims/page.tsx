import { ClaimManager } from "../../components/admin/ClaimManager";
export const metadata = { title: "认领审核" };
export default function ClaimsPage() { return <main className="admin-page"><header className="admin-header"><div><span className="eyebrow">CLAIM REVIEW</span><h1>角色认领审核</h1><p>通过后账户与游戏角色一对一绑定；同一角色不能重复绑定。</p></div></header><ClaimManager /></main>; }
