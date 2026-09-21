"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, ClipboardCheck, ShieldCheck, UserRound } from "lucide-react";
import type { PlatformRole } from "@/src/platform/domain.mjs";

const roles: Array<{ role: PlatformRole; title: string; description: string; icon: typeof Building2 }> = [
  { role: "enterprise", title: "企业账号", description: "提交需求、直接邀约、选定专家、确认服务单与验收成果。", icon: Building2 },
  { role: "expert", title: "专家账号", description: "维护认证材料、响应邀约、报价、确认服务单与交付成果。", icon: UserRound },
  { role: "consultant", title: "服务顾问", description: "核验需求、监督协商、建单、记录纪要与发起变更。", icon: ClipboardCheck },
  { role: "admin", title: "超级管理员", description: "审核专家认证、治理异常、管理费率版本与查看审计链。", icon: ShieldCheck },
];

export function PlatformLogin() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlatformRole>("enterprise");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enter() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/platform/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: selected }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "无法建立演示会话。");
      router.push("/platform/workspace");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法建立演示会话。");
      setBusy(false);
    }
  }

  return (
    <main className="platform-login">
      <section className="login-intro">
        <a className="platform-wordmark" href="/" aria-label="返回匠应达官网"><span>匠应达</span><small>工程专家经验服务平台</small></a>
        <div>
          <p className="demo-label">模拟 MVP · 不付款、不发短信、不上传真实敏感证件</p>
          <h1>从一个明确角色进入，<br />把责任做完整。</h1>
          <p>本入口用于验证四角色流程、权限和状态机。所有业务数据留在当前模拟服务进程，不代表真实身份认证或正式交易。</p>
        </div>
      </section>
      <section className="login-panel" aria-labelledby="role-heading">
        <div className="panel-heading"><h2 id="role-heading">选择演示身份</h2><p>不同身份看到不同路由与业务动作。</p></div>
        <div className="role-options">
          {roles.map(({ role, title, description, icon: Icon }) => (
            <button key={role} type="button" className={`role-option ${selected === role ? "is-selected" : ""}`} onClick={() => setSelected(role)} aria-pressed={selected === role}>
              <Icon aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span>
            </button>
          ))}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="platform-button primary wide" type="button" onClick={enter} disabled={busy}>{busy ? "正在进入…" : "进入角色工作台"}<ArrowRight aria-hidden="true" /></button>
      </section>
    </main>
  );
}
