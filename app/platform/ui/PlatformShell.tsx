"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, Check, CheckCircle2, ClipboardList, Clock3, FileText, LogOut, Menu, RefreshCw, ShieldAlert, X } from "lucide-react";
import type { PlatformActor } from "@/src/platform/domain.mjs";
import { PLATFORM_NAV, type PlatformRoute, type PlatformScreen } from "@/src/platform/routes";

type State = Record<string, any>;
type Command = Record<string, unknown> & { type: string };

const roleLabels = { enterprise: "企业", expert: "专家", consultant: "服务顾问", admin: "超级管理员" } as const;
const statusLabels: Record<string, string> = {
  submitted: "待顾问核验", needs_supplement: "待补充", verified: "已核验", sent: "待响应", accepted: "已接受",
  negotiating: "协商中", selected: "已选定", closed_unselected: "已落选关闭", declined: "已拒绝", awaiting_confirmation: "待确认",
  confirmed: "双方已确认", invalidated: "已失效", in_progress: "进行中", change_pending: "变更待确认", completed: "已完成",
  awaiting_acceptance: "待验收", withdrawn: "已撤回", returned: "已退回", supplement_requested: "待补交", pending: "待审核",
  needs_review: "待处理", recorded: "已记录", paused: "已暂停", on_time: "按时", reassigned: "已转派", overdue_reassigned: "超时已重分",
};

const money = (cents = 0) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(cents / 100);
const time = (value?: string) => value ? new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
const label = (status?: string) => status ? statusLabels[status] ?? status : "—";

function Status({ value }: { value?: string }) {
  return <span className={`status status-${value ?? "unknown"}`}>{label(value)}</span>;
}

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return <section className="work-card"><header><h2>{title}</h2>{aside}</header>{children}</section>;
}

function Empty({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="empty-state"><ClipboardList aria-hidden="true" /><h3>{title}</h3><p>{description}</p>{href && <Link className="text-action" href={href}>{action ?? "继续"}<ArrowRight aria-hidden="true" /></Link>}</div>;
}

function ErrorView({ error, retry }: { error: string; retry: () => void }) {
  return <div className="state-view error-state" role="alert"><AlertTriangle aria-hidden="true" /><h2>暂时无法读取平台数据</h2><p>{error}</p><button className="platform-button secondary" onClick={retry}><RefreshCw aria-hidden="true" />重试</button></div>;
}

function Loading() {
  return <div className="loading-grid" aria-label="正在加载"><span /><span /><span /></div>;
}

function ActionButton({ children, tone = "primary", disabled = false, onClick, type = "button" }: { children: ReactNode; tone?: "primary" | "secondary" | "danger" | "warning"; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return <button className={`platform-button ${tone}`} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

export function PlatformShell({ actor, route, allowed }: { actor: PlatformActor; route: PlatformRoute; allowed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/platform", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { router.push("/platform/login"); return; }
      if (!response.ok) throw new Error(data?.error?.message ?? "无法读取平台数据。");
      setState(data.state);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取平台数据。");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const execute = useCallback(async (command: Command, success: string) => {
    if (!state || busy) return null;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/platform", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ command, expectedVersion: state.version, idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "操作失败，请重试。");
      setState(data.state); setNotice(success);
      return data.result as Record<string, any>;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作失败，请重试。");
      await load();
      return null;
    } finally { setBusy(false); }
  }, [busy, load, state]);

  async function logout() {
    await fetch("/api/platform/session", { method: "DELETE" });
    router.push("/platform/login"); router.refresh();
  }

  const unread = useMemo(() => state?.notifications?.filter((item: any) => !item.readAt).length ?? 0, [state]);

  if (!allowed) {
    return <main className="forbidden-page"><ShieldAlert aria-hidden="true" /><p className="demo-label">403 · 角色权限不符</p><h1>这个页面不属于当前角色。</h1><p>{roleLabels[actor.role]}账号不能访问“{route.title}”。页面守卫与命令接口都会拒绝该操作。</p><Link className="platform-button primary" href="/platform/workspace">返回角色工作台</Link></main>;
  }

  return (
    <div className={`platform-app role-${actor.role}`}>
      <aside className={`platform-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand"><strong>匠应达</strong><small>{roleLabels[actor.role]}</small></div>
        <nav aria-label={`${roleLabels[actor.role]}业务导航`}>
          {PLATFORM_NAV[actor.role].map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>{item.label}{item.href === "/platform/messages" && unread > 0 && <span>{unread}</span>}</Link>)}
        </nav>
        <div className="demo-boundary"><span />模拟数据环境<small>不付款 · 不发短信 · 不上传真实敏感证件</small></div>
      </aside>
      <div className="platform-main">
        <header className="platform-topbar">
          <button className="menu-toggle" aria-label={menuOpen ? "关闭导航" : "打开导航"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <div><small>{roleLabels[actor.role]} /</small><strong>{route.title}</strong></div>
          <div className="topbar-actions"><Link href="/platform/messages" aria-label={`消息，${unread} 条未读`}><Bell /><span>{unread}</span></Link><button onClick={logout}><LogOut />退出</button></div>
        </header>
        <main className="platform-content">
          {notice && <div className="feedback success" role="status"><CheckCircle2 />{notice}</div>}
          {error && !loading && state && <div className="feedback error" role="alert"><AlertTriangle />{error}<button onClick={() => setError("")}>关闭</button></div>}
          {loading ? <Loading /> : error && !state ? <ErrorView error={error} retry={() => void load()} /> : state ? <Screen screen={route.screen} objectId={route.objectId} actor={actor} state={state} busy={busy} execute={execute} router={router} /> : null}
        </main>
      </div>
    </div>
  );
}

function Screen(props: { screen: PlatformScreen; objectId?: string; actor: PlatformActor; state: State; busy: boolean; execute: (command: Command, success: string) => Promise<Record<string, any> | null>; router: ReturnType<typeof useRouter> }) {
  switch (props.screen) {
    case "workspace": return <Workspace {...props} />;
    case "demand-new": return <DemandNew {...props} />;
    case "demand-detail": return <DemandDetail {...props} />;
    case "candidates": return <Candidates {...props} />;
    case "invitation": return <Invitation {...props} />;
    case "service-order": return <ServiceOrder {...props} />;
    case "project": return <Project {...props} />;
    case "consultant-queue": return <ConsultantQueue {...props} />;
    case "consultant-matching": return <Matching {...props} />;
    case "messages": return <Messages {...props} />;
    case "admin-certifications": return <AdminCertifications {...props} />;
    case "admin-exceptions": return <AdminExceptions {...props} />;
    case "admin-rates": return <AdminRates {...props} />;
    case "admin-audit": return <AdminAudit {...props} />;
    case "enterprise-profile": return <Profile actor={props.actor} kind="enterprise" />;
    case "expert-profile": return <Profile actor={props.actor} kind="expert" state={props.state} />;
    case "expert-certification": return <ExpertCertification {...props} />;
  }
}

type ScreenProps = Parameters<typeof Screen>[0];

function PageLead({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className="page-lead"><div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="lead-actions">{actions}</div>}</div>;
}

function Workspace({ actor, state }: ScreenProps) {
  const demands = state.demands ?? [], invitations = state.invitations ?? [], orders = state.serviceOrders ?? [], projects = state.projects ?? [];
  const primary = actor.role === "enterprise" ? { text: "创建新的技术需求", href: "/platform/demands/new" } : actor.role === "consultant" ? { text: "处理待核验需求", href: "/platform/consultant/queue" } : actor.role === "admin" ? { text: "审核专家认证", href: "/platform/admin/certifications" } : { text: "查看邀约与任务", href: invitations[0] ? `/platform/invitations/${invitations[0].id}` : "/platform/messages" };
  return <>
    <PageLead title={`下午好，${actor.name}`} description="当前状态来自业务对象；状态、版本、确认和通知由同一领域事件派生。" actions={<Link className="platform-button primary" href={primary.href}>{primary.text}<ArrowRight /></Link>} />
    <div className="task-banner"><div><span>优先处理</span><strong>{actor.role === "consultant" ? "核验 D-2026-024 的结构化需求" : actor.role === "enterprise" ? "确认需求已核验后再发送专家邀约" : actor.role === "expert" ? "查看新邀约、报价与项目交付任务" : "完成认证审核并检查异常审计"}</strong></div><Clock3 /><small>模拟数据 · 所有动作即时写入审计链</small></div>
    <div className="metric-row"><div><span>需求</span><strong>{demands.length}</strong><small>{demands.filter((d: any) => d.status !== "verified").length} 条待推进</small></div><div><span>邀约</span><strong>{invitations.length}</strong><small>{invitations.filter((i: any) => ["sent", "accepted", "negotiating"].includes(i.status)).length} 条进行中</small></div><div><span>服务单</span><strong>{orders.length}</strong><small>{orders.filter((o: any) => o.status === "awaiting_confirmation").length} 份待确认</small></div><div><span>项目</span><strong>{projects.length}</strong><small>{projects.filter((p: any) => p.status === "in_progress").length} 个进行中</small></div></div>
    <div className="two-column">
      <Card title="当前业务推进">
        <div className="record-list">{demands.map((d: any) => <Link key={d.id} href={`/platform/demands/${d.id}`}><span><strong>{d.id}</strong><small>{d.title}</small></span><Status value={d.projectId ? projects.find((p: any) => p.id === d.projectId)?.status : d.status} /></Link>)}{demands.length === 0 && <Empty title="暂无可见需求" description="当前角色没有所属或受托需求。" />}</div>
      </Card>
      <Card title="角色边界">
        <ul className="boundary-list"><li><Check />只显示当前角色与对象归属允许的操作。</li><li><Check />顾问和管理员不能替企业或专家确认。</li><li><Check />管理员治理不覆盖历史业务事实。</li><li><Check />演示费用快照不代表真实收款或结算。</li></ul>
      </Card>
    </div>
  </>;
}

function DemandNew({ actor, execute, busy, router }: ScreenProps) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const result = await execute({ type: "submitDemand", title: form.get("title"), problem: form.get("problem"), objective: form.get("objective"), timeline: form.get("timeline"), deliverable: form.get("deliverable"), acceptanceCriteria: form.get("acceptanceCriteria"), dataPermissions: form.get("dataPermissions"), delegationReason: form.get("delegationReason") }, actor.role === "consultant" ? "需求已按企业委托代录，委托依据已写入审计。" : "需求已提交顾问核验。");
    if (result?.demandId) router.push(`/platform/demands/${result.demandId}`);
  }
  return <><PageLead title="创建企业需求" description={actor.role === "consultant" ? "仅在企业明确委托范围内代录；委托依据、操作人和后续核验全部留痕。" : "问题、目标、成果与验收标准会进入顾问核验；提交后不能跳过核验直接匹配。"} />
    <form className="work-form" onSubmit={submit}><label>需求标题<input name="title" required defaultValue="生产线能耗异常诊断" /></label>{actor.role === "consultant" && <label>企业委托依据<input name="delegationReason" required placeholder="例如：企业工单编号与授权范围" /></label>}<label className="span-2">问题原文<textarea name="problem" required defaultValue="生产线单位能耗近三个月波动增大，需要定位工艺或设备侧原因。" /></label><label>项目目标<input name="objective" required defaultValue="识别主要影响因素并给出参数优化建议" /></label><label>计划周期<input name="timeline" required defaultValue="2026-10-15 至 2026-11-30" /></label><label>成果形式<input name="deliverable" required defaultValue="诊断报告、参数建议与复核清单" /></label><label>资料权限<input name="dataPermissions" required defaultValue="仅开放脱敏运行参数与工艺摘要" /></label><label className="span-2">验收标准<textarea name="acceptanceCriteria" required defaultValue="说明证据来源，完成异常归因，并给出可执行的验证步骤。" /></label><div className="form-actions span-2"><p>提交后生成只读核验记录；失败时保留当前输入。</p><ActionButton type="submit" disabled={busy}>{busy ? "提交中…" : actor.role === "consultant" ? "按委托代录并提交核验" : "确认并提交顾问核验"}</ActionButton></div></form>
  </>;
}

function DemandDetail({ actor, state, objectId, execute, busy }: ScreenProps) {
  const demand = state.demands.find((item: any) => item.id === objectId);
  const project = demand?.projectId ? state.projects.find((item: any) => item.id === demand.projectId) : null;
  if (!demand) return <Empty title="无法查看此需求" description="需求不存在，或当前账号不属于该对象。" href="/platform/workspace" action="返回工作台" />;
  return <><PageLead title={`${demand.id} · ${demand.title}`} description={project ? `此需求已转为项目 ${project.id}，需求状态只读展示项目派生状态。` : "需求在项目创建前由核验和邀约事件推进。"} actions={!project && demand.status === "verified" ? <Link className="platform-button primary" href={`/platform/demands/${demand.id}/candidates`}>查看候选专家<ArrowRight /></Link> : project ? <Link className="platform-button primary" href={`/platform/projects/${project.id}`}>进入项目<ArrowRight /></Link> : null} />
    <div className="status-strip"><div><small>当前状态</small><Status value={project?.status ?? demand.status} /></div><div><small>负责顾问</small><strong>{demand.assignedConsultantId}</strong></div><div><small>核验 SLA</small><strong>{label(demand.slaStatus)}</strong><small>{time(demand.slaDueAt)}</small></div><div><small>对象版本</small><strong>V{demand.version}</strong></div></div>
    <div className="two-column"><Card title="企业原始需求"><dl className="detail-list"><div><dt>问题</dt><dd>{demand.problem}</dd></div><div><dt>目标</dt><dd>{demand.objective}</dd></div><div><dt>周期</dt><dd>{demand.timeline}</dd></div><div><dt>成果</dt><dd>{demand.deliverable}</dd></div><div><dt>验收标准</dt><dd>{demand.acceptanceCriteria}</dd></div><div><dt>资料权限</dt><dd>{demand.dataPermissions}</dd></div></dl></Card>
      <Card title="核验结论" aside={<Status value={demand.status} />}>
        {demand.verificationHistory.length ? <div className="timeline">{[...demand.verificationHistory].reverse().map((item: any) => <div key={`${item.createdAt}-${item.version}`}><span /><strong>{label(item.status)}</strong><small>{time(item.createdAt)} · {item.reviewerId}</small><p>{item.reason || "核验信息完整，可进入候选与邀约。"}</p></div>)}</div> : <p className="muted">尚未生成核验记录。顾问需要核对范围、成果、验收标准和资料权限。</p>}
        {actor.role === "consultant" && ["submitted", "needs_supplement"].includes(demand.status) && <div className="action-stack"><ActionButton disabled={busy} onClick={() => void execute({ type: "reviewDemand", demandId: demand.id, decision: "verify" }, "核验通过，企业现在可以查看候选并发送邀约。")}>核验通过</ActionButton><ActionButton tone="danger" disabled={busy} onClick={() => { const reason = window.prompt("请写明企业需要补充的具体内容"); if (reason) void execute({ type: "reviewDemand", demandId: demand.id, decision: "request_supplement", reason }, "已退回企业补充，并发送通知。"); }}>退回补充</ActionButton></div>}
        {actor.role === "enterprise" && demand.status === "needs_supplement" && <ActionButton disabled={busy} onClick={() => { const addition = window.prompt("请补充验收标准或缺失信息"); if (addition) void execute({ type: "reviseDemand", demandId: demand.id, acceptanceCriteria: `${demand.acceptanceCriteria}；补充：${addition}` }, "补充内容已提交，需求重新进入顾问核验队列。"); }}>补充并重新提交</ActionButton>}
        {actor.role === "consultant" && !project && <ActionButton tone="warning" disabled={busy} onClick={() => { const reason = window.prompt("请输入转派原因和交接说明"); if (reason) void execute({ type: "transferConsultant", demandId: demand.id, newConsultantId: "CON-018", reason }, "需求已转派给 G-018，企业和交接双方已收到通知。"); }}>转派给 G-018</ActionButton>}
        {demand.assignmentHistory?.length > 0 && <details><summary>查看分配与转派历史</summary><div className="version-history">{[...demand.assignmentHistory].reverse().map((item: any, index: number) => <div key={`${item.createdAt}-${index}`}><strong>{item.from ?? "系统分配"} → {item.to}</strong><p>{item.reason}</p><small>{time(item.createdAt)} · {item.actorId}</small></div>)}</div></details>}
      </Card></div>
  </>;
}

function Candidates({ actor, state, objectId, execute, busy, router }: ScreenProps) {
  const demand = state.demands.find((item: any) => item.id === objectId);
  if (!demand) return <Empty title="候选页不可用" description="需求不存在或当前账号没有权限。" href="/platform/workspace" />;
  const experts = state.people.filter((person: any) => person.role === "expert");
  async function invite(expertId: string) {
    const delegationReason = actor.role === "consultant" ? window.prompt("请填写企业委托顾问代发邀约的依据")?.trim() : undefined;
    if (actor.role === "consultant" && !delegationReason) return;
    const result = await execute({ type: "sendInvitation", demandId: demand.id, expertId, dataAccessConfirmed: true, delegationReason }, actor.role === "consultant" ? "邀约已按企业委托代发，依据与操作人已写入审计。" : "邀约已发送，专家和顾问已收到下一步通知。");
    if (result?.invitationId) router.push(`/platform/invitations/${result.invitationId}`);
  }
  return <><PageLead title="候选专家与直接邀约" description={`${demand.id} 已由顾问核验。企业可直接发送邀约；顾问只能在明确授权下代发。`} />
    <div className="candidate-grid">{experts.map((expert: any) => <article key={expert.id} className="candidate"><div><span className="avatar">{expert.id.replace("EXP-", "E")}</span><div><h2>{expert.name}</h2><p>{expert.specialties?.join(" · ") || "待补充能力标签"}</p></div></div><dl><div><dt>认证</dt><dd><Status value={expert.certificationStatus} /></dd></div><div><dt>匹配解释</dt><dd>{expert.certificationStatus === "verified" ? "能力标签与需求方向相符；仍需报价和双方确认。" : "认证未完成，不进入可邀约名单。"}</dd></div></dl><ActionButton disabled={busy || expert.certificationStatus !== "verified"} onClick={() => void invite(expert.id)}>{expert.certificationStatus !== "verified" ? "认证未通过" : actor.role === "consultant" ? "按企业委托代发邀约" : "发送项目邀约"}</ActionButton></article>)}</div>
  </>;
}

function Invitation({ actor, state, objectId, execute, busy, router }: ScreenProps) {
  const invitation = state.invitations.find((item: any) => item.id === objectId);
  if (!invitation) return <Empty title="无法查看此邀约" description="邀约不存在，或当前账号不是参与方。" href="/platform/workspace" />;
  const demand = state.demands.find((item: any) => item.id === invitation.demandId);
  const latest = invitation.quotes.at(-1);
  const existingOrder = state.serviceOrders.find((item: any) => item.invitationId === invitation.id);
  async function quote(event: FormEvent<HTMLFormElement>, counter = false) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await execute({ type: counter ? "counterQuote" : "submitQuote", invitationId: invitation.id, serviceAmount: Math.round(Number(form.get("serviceAmount")) * 100), travel: Math.round(Number(form.get("travel")) * 100), tax: Math.round(Number(form.get("tax")) * 100), thirdParty: Math.round(Number(form.get("thirdParty")) * 100), scope: form.get("scope"), timeline: demand?.timeline }, counter ? "反报价已生成新版本。" : "报价已生成新版本。");
  }
  async function createOrder() { const result = await execute({ type: "createServiceOrder", invitationId: invitation.id }, "服务单 V1 已建立，并通知企业和专家确认。"); if (result?.orderId) router.push(`/platform/service-orders/${result.orderId}`); }
  return <><PageLead title={`${invitation.id} · 邀约与报价协商`} description="报价只增不改；企业选定后，顾问根据最新报价建立服务单。" actions={<Status value={invitation.status} />} />
    <div className="three-column"><Card title="邀约信息"><dl className="detail-list"><div><dt>需求</dt><dd>{demand?.title ?? invitation.demandId}</dd></div><div><dt>受邀专家</dt><dd>{invitation.expertId}</dd></div><div><dt>监督顾问</dt><dd>{invitation.consultantId}</dd></div><div><dt>发送主体</dt><dd>{invitation.sentByRole === "consultant" ? `受托顾问 ${invitation.sentBy}` : `企业 ${invitation.sentBy}`}</dd></div>{invitation.delegationReason && <div><dt>委托依据</dt><dd>{invitation.delegationReason}</dd></div>}<div><dt>资料授权</dt><dd>{time(invitation.dataAccessConfirmedAt)} 已确认</dd></div></dl>{actor.role === "expert" && invitation.status === "sent" && <div className="action-stack"><ActionButton disabled={busy} onClick={() => void execute({ type: "respondInvitation", invitationId: invitation.id, decision: "accept" }, "你已接受邀约，可以提交报价。")}>接受邀约</ActionButton><ActionButton tone="danger" disabled={busy} onClick={() => void execute({ type: "respondInvitation", invitationId: invitation.id, decision: "decline" }, "你已拒绝邀约，企业和顾问已收到通知。")}>拒绝邀约</ActionButton></div>}</Card>
      <Card title="报价版本" aside={<span className="version-badge">{latest ? `最新 V${latest.version}` : "尚未报价"}</span>}><div className="quote-history">{[...invitation.quotes].reverse().map((q: any) => <div key={q.id}><header><strong>报价 V{q.version}</strong><small>{q.submittedByRole === "expert" ? "专家" : "企业"} · {time(q.createdAt)}</small></header><p>{q.scope}</p><dl><div><dt>服务金额</dt><dd>{money(q.serviceAmount)}</dd></div><div><dt>差旅 / 税费 / 三方</dt><dd>{money(q.travel)} / {money(q.tax)} / {money(q.thirdParty)}</dd></div></dl></div>)}</div>{latest && actor.role === "enterprise" && invitation.status !== "selected" && <ActionButton disabled={busy} onClick={() => void execute({ type: "selectInvitation", invitationId: invitation.id, quoteVersion: latest.version }, "已选定专家；其他进行中邀约将礼貌关闭。")}>选定该专家</ActionButton>}{actor.role === "consultant" && invitation.status === "selected" && !existingOrder && <ActionButton disabled={busy} onClick={() => void createOrder()}>根据最新报价建立服务单</ActionButton>}{existingOrder && <Link className="platform-button primary" href={`/platform/service-orders/${existingOrder.id}`}>进入服务单<ArrowRight /></Link>}</Card>
      {(actor.role === "expert" || actor.role === "enterprise") && !["selected", "closed_unselected", "declined"].includes(invitation.status) ? <Card title={actor.role === "expert" ? "提交专家报价" : "提交企业反报价"}><form className="compact-form" onSubmit={(event) => void quote(event, actor.role === "enterprise")}><label>服务金额（唯一费基）<input name="serviceAmount" type="number" min="1" step="0.01" required defaultValue={latest ? latest.serviceAmount / 100 : 19200} /></label><label>预计差旅<input name="travel" type="number" min="0" step="0.01" defaultValue={latest ? latest.travel / 100 : 1800} /></label><label>税费<input name="tax" type="number" min="0" step="0.01" defaultValue={latest ? latest.tax / 100 : 0} /></label><label>第三方成本<input name="thirdParty" type="number" min="0" step="0.01" defaultValue={latest ? latest.thirdParty / 100 : 0} /></label><label>服务范围<textarea name="scope" required defaultValue={latest?.scope ?? demand?.deliverable} /></label><ActionButton type="submit" disabled={busy || (actor.role === "expert" && invitation.status === "sent")}>{busy ? "提交中…" : "生成新报价版本"}</ActionButton></form></Card> : <Card title="协商边界"><p className="muted">顾问只监督和记录纪要，不能替任何一方报价或选定。落选专家看不到中选报价。</p></Card>}</div>
  </>;
}

function ServiceOrder({ actor, state, objectId, execute, busy, router }: ScreenProps) {
  const order = state.serviceOrders.find((item: any) => item.id === objectId);
  if (!order) return <Empty title="无法查看此服务单" description="服务单不存在，或当前账号不是关联方。" href="/platform/workspace" />;
  const current = order.versions.find((item: any) => item.version === order.currentVersion);
  const fee = state.feeSnapshots?.find((item: any) => item.orderId === order.id && item.orderVersion === current.version);
  const existingProject = state.projects.find((item: any) => item.orderId === order.id);
  async function createProject() { const result = await execute({ type: "createProject", orderId: order.id }, "项目已创建；需求页将只读显示项目派生状态。"); if (result?.projectId) router.push(`/platform/projects/${result.projectId}`); }
  return <><PageLead title={`服务单 ${order.id} · V${order.currentVersion}`} description="企业和专家分别确认同一最新版本；关键条款变化会创建新版本并使旧确认失效。" actions={<Status value={current.status} />} />
    <div className="version-warning">{order.versions.length > 1 ? `V${order.currentVersion} 等待重新确认；历史版本只读保留。` : "V1 为当前版本；任何关键字段变更都会清空确认。"}</div>
    <div className="two-column wide-main"><Card title="服务条款" aside={<span className="version-badge">当前 V{current.version}</span>}><dl className="terms"><div><dt>服务范围</dt><dd>{current.terms.scope}</dd></div><div><dt>服务金额 serviceAmount</dt><dd>{money(current.terms.serviceAmount)} <small>15% 唯一费基</small></dd></div><div><dt>排除项</dt><dd>差旅 {money(current.terms.travel)} · 税费 {money(current.terms.tax)} · 第三方 {money(current.terms.thirdParty)}</dd></div><div><dt>总额展示 grossTotal</dt><dd>{money(current.terms.serviceAmount + current.terms.travel + current.terms.tax + current.terms.thirdParty)} <small>不参与费率计算</small></dd></div><div><dt>服务周期</dt><dd>{current.terms.timeline}</dd></div><div><dt>验收标准</dt><dd>{current.terms.acceptanceCriteria}</dd></div></dl>
        <details><summary>查看历史版本与失效原因</summary><div className="version-history">{[...order.versions].reverse().map((version: any) => <div key={version.version}><strong>V{version.version}</strong><Status value={version.status} /><p>{version.reason}</p><small>{time(version.createdAt)} · {version.createdBy}</small></div>)}</div></details>
      </Card><div className="side-stack"><Card title="确认状态"><div className="confirmation-grid"><div><strong>企业</strong>{current.confirmations.enterprise ? <span><Check />已确认</span> : <span><Clock3 />待确认</span>}</div><div><strong>专家</strong>{current.confirmations.expert ? <span><Check />已确认</span> : <span><Clock3 />待确认</span>}</div></div>{["enterprise", "expert"].includes(actor.role) && !current.confirmations[actor.role] && current.status === "awaiting_confirmation" && <ActionButton disabled={busy} onClick={() => void execute({ type: "confirmServiceOrder", orderId: order.id, version: current.version }, `你已确认 V${current.version}。`)}>确认 V{current.version}</ActionButton>}{actor.role === "consultant" && current.status === "awaiting_confirmation" && <p className="muted">顾问只能查看确认进度，不能替企业或专家确认。</p>}{actor.role === "consultant" && order.status === "confirmed" && !existingProject && <ActionButton disabled={busy} onClick={() => void createProject()}>创建项目</ActionButton>}{existingProject && <Link className="platform-button primary" href={`/platform/projects/${existingProject.id}`}>进入项目<ArrowRight /></Link>}</Card>
        <Card title="费用快照">{fee ? <dl className="fee-snapshot"><div><dt>费率版本</dt><dd>{fee.rateVersion} · 15%</dd></div><div><dt>平台费</dt><dd>{money(fee.fee)}</dd></div><div><dt>专家应收</dt><dd>{money(fee.expertNet)}</dd></div><div><dt>冻结时间</dt><dd>{time(fee.createdAt)}</dd></div></dl> : <p className="muted">双方确认后按当前服务单版本冻结。差旅、税费和第三方成本不计费。</p>}</Card>
        {actor.role === "consultant" && <Card title="发起服务单变更"><p className="muted">范围、报价、时间或验收变化都将生成 V{current.version + 1}，旧确认立即失效。</p><ActionButton tone="warning" disabled={busy} onClick={() => { const reason = window.prompt("请写明变更原因"); if (reason) void execute({ type: "reviseServiceOrder", orderId: order.id, reason, terms: { acceptanceCriteria: `${current.terms.acceptanceCriteria}（变更补充）` } }, `已创建 V${current.version + 1}，旧确认失效。`); }}>发起变更</ActionButton></Card>}</div></div>
  </>;
}

function Project({ actor, state, objectId, execute, busy }: ScreenProps) {
  const project = state.projects.find((item: any) => item.id === objectId);
  if (!project) return <Empty title="无法查看此项目" description="项目不存在，或当前账号不属于项目参与方。" href="/platform/workspace" />;
  const latest = project.deliverableVersions.find((item: any) => item.id === project.latestDeliverableVersionId);
  const latestEvent = latest ? [...project.deliverableEvents].reverse().find((item: any) => item.deliverableVersionId === latest.id) : null;
  const fee = state.feeSnapshots?.find((item: any) => item.orderId === project.orderId && item.orderVersion === project.orderVersion);
  async function deliver(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await execute({ type: "submitDeliverable", projectId: project.id, content: form.get("content") }, "成果新版本已提交，企业和顾问已收到通知。"); event.currentTarget.reset(); }
  function decide(decision: string) { const reason = decision === "accept" ? "" : window.prompt("请填写退回或补充的具体依据") ?? ""; if (decision !== "accept" && !reason) return; void execute({ type: "decideDeliverable", projectId: project.id, decision, reason }, decision === "accept" ? "成果已通过，项目完成。" : "验收决定已保存，专家和顾问已收到通知。"); }
  return <><PageLead title={`项目 ${project.id} · 里程碑交付`} description="项目创建后是唯一事实源；需求页、工作台和消息中心只展示此处派生的状态。" actions={<Status value={project.status} />} />
    <div className="status-strip"><div><small>里程碑</small><Status value={project.milestones[0].status} /></div><div><small>服务单</small><strong>{project.orderId} · V{project.orderVersion}</strong></div><div><small>当前成果</small><strong>{latest ? `V${latest.version}` : "尚未提交"}</strong></div></div>
    <div className="two-column wide-main"><Card title="成果版本与验收"><div className="deliverable-table"><div className="table-head"><span>版本</span><span>成果说明</span><span>当前结果</span><span>时间</span></div>{[...project.deliverableVersions].reverse().map((item: any) => { const event = [...project.deliverableEvents].reverse().find((entry: any) => entry.deliverableVersionId === item.id); return <div key={item.id}><strong>V{item.version}</strong><span>{item.content}</span><Status value={event?.status} /><small>{time(item.createdAt)}</small></div>; })}</div>
        {actor.role === "expert" && project.status === "in_progress" && (!latestEvent || ["withdrawn", "returned", "supplement_requested"].includes(latestEvent.status)) && <form className="inline-form" onSubmit={(event) => void deliver(event)}><label>成果说明<textarea name="content" required placeholder="说明本次提交内容与对应验收标准" /></label><ActionButton type="submit" disabled={busy}>{latest ? "补交成果新版本" : "提交成果"}</ActionButton></form>}
        {actor.role === "expert" && latestEvent?.status === "submitted" && <ActionButton tone="danger" disabled={busy} onClick={() => { const reason = window.prompt("请填写撤回原因"); if (reason) void execute({ type: "withdrawDeliverable", projectId: project.id, reason }, "成果已撤回，历史版本仍保留。"); }}>撤回当前成果</ActionButton>}
        {actor.role === "enterprise" && latestEvent?.status === "submitted" && <div className="acceptance-actions"><ActionButton tone="danger" disabled={busy} onClick={() => decide("return")}>退回</ActionButton><ActionButton tone="warning" disabled={busy} onClick={() => decide("request_supplement")}>要求补充</ActionButton><ActionButton disabled={busy} onClick={() => decide("accept")}>通过</ActionButton></div>}
        {actor.role === "enterprise" && project.status === "completed" && !project.evaluation && <ActionButton disabled={busy} onClick={() => void execute({ type: "evaluateProject", projectId: project.id, rating: 5, comment: "演示评价：成果与约定范围一致。" }, "项目评价已保存为只读记录。")}>提交五星演示评价</ActionButton>}
      </Card><div className="side-stack"><Card title="项目与费用快照">{fee ? <dl className="fee-snapshot"><div><dt>serviceAmount 费基</dt><dd>{money(fee.serviceAmount)}</dd></div><div><dt>平台费</dt><dd>{money(fee.fee)}</dd></div><div><dt>专家应收</dt><dd>{money(fee.expertNet)}</dd></div><div><dt>排除项</dt><dd>{money(fee.travel + fee.tax + fee.thirdParty)}</dd></div></dl> : <p className="muted">未找到当前服务单版本的冻结快照。</p>}</Card>
        <Card title="业务事件时间线"><div className="timeline">{[...project.deliverableEvents].reverse().map((event: any) => <div key={event.id}><span /><strong>{event.status === "submitted" ? "已提交待验收" : label(event.status)}</strong><small>{time(event.createdAt)} · {event.actorId}</small><p>{event.reason || "业务动作已记录。"}</p></div>)}</div></Card>
        {actor.role === "consultant" && <Card title="顾问监督"><p className="muted">提醒不改变业务状态；纪要双方可见且不可改；暂停或恢复必须填写依据。</p><div className="action-stack"><ActionButton disabled={busy} onClick={() => { const message = window.prompt("请输入给专家的项目提醒"); if (message) void execute({ type: "remindProject", projectId: project.id, targetRole: "expert", message }, "提醒已发送，项目状态未改变。"); }}>提醒专家</ActionButton><ActionButton tone="secondary" disabled={busy} onClick={() => { const summary = window.prompt("请输入会议或关键沟通纪要"); if (summary) void execute({ type: "recordMeeting", projectId: project.id, summary }, "纪要已记录并通知双方。"); }}>记录纪要</ActionButton>{project.status === "paused" ? <ActionButton disabled={busy} onClick={() => { const reason = window.prompt("请输入恢复依据"); if (reason) void execute({ type: "resumeProject", projectId: project.id, reason }, "项目已恢复并通知双方。"); }}>恢复项目</ActionButton> : <ActionButton tone="warning" disabled={busy || !["in_progress", "change_pending"].includes(project.status)} onClick={() => { const reason = window.prompt("请输入暂停风险或双方请求依据"); if (reason) void execute({ type: "pauseProject", projectId: project.id, reason }, "项目已暂停并通知双方。"); }}>暂停项目</ActionButton>}</div>{state.reminders?.filter((item: any) => item.projectId === project.id).length > 0 && <details><summary>查看提醒记录</summary><div className="version-history">{state.reminders.filter((item: any) => item.projectId === project.id).map((item: any) => <div key={item.id}><strong>提醒 {item.targetRole === "expert" ? "专家" : "企业"}</strong><p>{item.message}</p><small>{time(item.createdAt)} · {item.actorId}</small></div>)}</div></details>}{project.pauseHistory?.length > 0 && <details><summary>查看暂停与恢复记录</summary><div className="version-history">{[...project.pauseHistory].reverse().map((item: any, index: number) => <div key={`${item.createdAt}-${index}`}><strong>{item.action === "paused" ? "暂停" : "恢复"}</strong><p>{item.reason}</p><small>{time(item.createdAt)} · {item.actorId}</small></div>)}</div></details>}</Card>}
      </div></div>
  </>;
}

function ConsultantQueue({ state }: ScreenProps) {
  return <><PageLead title="顾问需求队列" description="待核验需求按状态和责任人进入同一队列；领取与核验必须保留记录。" />
    <Card title="待处理需求" aside={<span className="version-badge">{state.demands.filter((d: any) => ["submitted", "needs_supplement"].includes(d.status)).length} 项待办</span>}><div className="record-list">{state.demands.map((d: any) => <Link key={d.id} href={`/platform/demands/${d.id}`}><span><strong>{d.id}</strong><small>{d.title} · SLA {time(d.slaDueAt)} · {label(d.slaStatus)}</small></span><Status value={d.status} /></Link>)}</div></Card>
  </>;
}

function Matching({ state }: ScreenProps) {
  const verified = state.demands.filter((d: any) => d.status === "verified" && !d.projectId);
  return <><PageLead title="匹配工作台" description="只对已核验需求复核候选解释；顾问不能替企业完成最终选择。" />
    <Card title="可进入候选复核的需求">{verified.length ? <div className="record-list">{verified.map((d: any) => <Link key={d.id} href={`/platform/demands/${d.id}/candidates`}><span><strong>{d.id}</strong><small>{d.title}</small></span><span className="text-action">复核候选<ArrowRight /></span></Link>)}</div> : <Empty title="暂无已核验待匹配需求" description="先在需求队列完成顾问核验。" href="/platform/consultant/queue" action="返回需求队列" />}</Card>
  </>;
}

function Messages({ state, execute, busy }: ScreenProps) {
  const pending = state.notifications.filter((item: any) => !item.handledAt);
  return <><PageLead title="消息中心" description="已读只改变阅读状态，不代表业务动作完成；已处理需单独标记。" />
    <Card title="待处理消息" aside={<span className="version-badge">{pending.length} 条</span>}><div className="message-list">{state.notifications.map((item: any) => <article key={item.id} className={!item.readAt ? "unread" : ""}><div><small>{time(item.createdAt)} · {item.objectType} {item.objectId}</small><h3>{item.title}</h3><p>{item.body}</p></div><div className="message-actions"><Link className="text-action" href={item.href}>{item.actionLabel}<ArrowRight /></Link>{!item.readAt && <button disabled={busy} onClick={() => void execute({ type: "markNotificationRead", notificationId: item.id }, "消息已标为已读，业务待办仍保留。")}>标为已读</button>}{!item.handledAt && <button disabled={busy} onClick={() => void execute({ type: "markNotificationHandled", notificationId: item.id }, "消息已标为处理完成。")}>标为已处理</button>}</div></article>)}{state.notifications.length === 0 && <Empty title="暂无消息" description="关键状态变化会在这里给出发生事项、影响和下一步入口。" />}</div></Card>
  </>;
}

function Profile({ actor, kind, state }: { actor: PlatformActor; kind: "enterprise" | "expert"; state?: State }) {
  const person = state?.people?.find((item: any) => item.id === actor.id);
  return <><PageLead title={kind === "enterprise" ? "企业资料" : "专家资料"} description={kind === "enterprise" ? "维护演示企业资料与顾问委托范围；不包含真实联系人。" : "公开资料与认证材料分离；MVP 不上传真实敏感证件。"} />
    <div className="two-column"><Card title="公开资料"><dl className="detail-list"><div><dt>演示编号</dt><dd>{actor.id}</dd></div><div><dt>显示名称</dt><dd>{actor.name}</dd></div><div><dt>角色</dt><dd>{roleLabels[actor.role]}</dd></div>{person?.specialties && <div><dt>能力标签</dt><dd>{person.specialties.join(" · ")}</dd></div>}</dl></Card><Card title="资料边界"><ul className="boundary-list"><li><Check />页面只展示演示信息。</li><li><Check />身份与认证仍需正式系统接入。</li><li><Check />真实证件、联系人与隐私信息不进入此 MVP。</li></ul></Card></div>
  </>;
}

function ExpertCertification({ actor, state }: ScreenProps) {
  const records = state.certifications.filter((item: any) => item.expertId === actor.id);
  const current = records.at(-1);
  return <><PageLead title="专家资料与认证" description="认证结论由超级管理员审核；专家不能自行把状态改为已认证。" />
    <div className="two-column"><Card title="认证进度">{current ? <dl className="detail-list"><div><dt>认证记录</dt><dd>{current.id} · V{current.version}</dd></div><div><dt>状态</dt><dd><Status value={current.status} /></dd></div><div><dt>材料摘要</dt><dd>{current.summary}</dd></div></dl> : <Empty title="暂无认证记录" description="当前演示身份没有待处理认证材料。" />}</Card><Card title="隐私与真实性说明"><ul className="boundary-list"><li><Check />仅提交演示材料摘要。</li><li><Check />不上传身份证、执照或真实敏感证件。</li><li><Check />管理员结论与依据作为只读记录。</li></ul></Card></div>
  </>;
}

function AdminCertifications({ state, execute, busy }: ScreenProps) {
  const pending = state.certifications.filter((item: any) => item.status === "pending");
  return <><PageLead title="专家认证审核" description="管理员保存审核依据；认证治理与项目业务确认严格分开。" />
    <Card title="待审核队列" aside={<span className="version-badge">{pending.length} 项待办</span>}><div className="admin-list">{state.certifications.map((item: any) => <article key={item.id}><div><small>{item.id} · V{item.version}</small><h3>{item.expertId}</h3><p>{item.summary}</p></div><div><Status value={item.status} />{item.status === "pending" && <div className="action-stack horizontal"><ActionButton disabled={busy} onClick={() => void execute({ type: "reviewCertification", certificationId: item.id, decision: "approve", reason: "演示材料摘要完整，认证通过。" }, "认证结论已保存并通知专家。")}>认证通过</ActionButton><ActionButton tone="danger" disabled={busy} onClick={() => { const reason = window.prompt("请记录需要补充的材料"); if (reason) void execute({ type: "reviewCertification", certificationId: item.id, decision: "request_supplement", reason }, "已退回补充并记录依据。"); }}>退回补充</ActionButton></div>}</div></article>)}</div></Card>
  </>;
}

function AdminExceptions({ state, execute, busy }: ScreenProps) {
  return <><PageLead title="项目异常治理" description="管理员可以记录、限制、恢复或升级处理，但不能替企业验收或替专家确认。" />
    <div className="two-column"><Card title="治理记录">{state.exceptions.length ? <div className="admin-list">{[...state.exceptions].reverse().map((item: any) => <article key={item.id}><div><small>{item.id} · {time(item.createdAt)}</small><h3>{item.objectType} {item.objectId}</h3><p>{item.reason}</p></div><Status value={item.status} /></article>)}</div> : <Empty title="当前无治理记录" description="演示环境可记录一条治理决定验证审计链。" />}</Card><Card title="记录治理决定"><p className="muted">治理事件追加保存，不覆盖原业务事实。</p><ActionButton disabled={busy} onClick={() => { const reason = window.prompt("请输入治理依据"); if (reason) void execute({ type: "governException", objectType: "Platform", objectId: "DEMO", decision: "review", reason }, "治理决定已记录并进入审计链。"); }}>记录演示治理决定</ActionButton></Card></div>
  </>;
}

function AdminRates({ state, execute, busy }: ScreenProps) {
  const current = state.rates.at(-1);
  return <><PageLead title="费率版本" description="费率按版本只增不改；费用快照保存服务单版本、费率版本和冻结时间。" />
    <div className="two-column"><Card title="当前费率"><div className="rate-display"><strong>{(current.basisPoints / 100).toFixed(2)}%</strong><span>{current.id} · V{current.version}</span><small>{time(current.activeAt)} 生效</small></div></Card><Card title="发布新费率版本"><p className="muted">新费率只影响之后完成双确认的新快照；历史快照保持不变。</p><ActionButton disabled={busy} onClick={() => { const value = window.prompt("请输入百分比，例如 15"); const basisPoints = Math.round(Number(value) * 100); if (Number.isFinite(basisPoints)) void execute({ type: "publishRate", basisPoints, reason: "演示费率版本变更" }, "新费率版本已发布；历史快照未改写。"); }}>发布演示费率版本</ActionButton></Card></div>
    <Card title="版本历史"><div className="version-history">{[...state.rates].reverse().map((rate: any) => <div key={rate.id}><strong>{rate.id}</strong><span>{(rate.basisPoints / 100).toFixed(2)}%</span><p>{rate.reason || "MVP 初始费率版本"}</p><small>{time(rate.activeAt)}</small></div>)}</div></Card>
  </>;
}

function AdminAudit({ state }: ScreenProps) {
  return <><PageLead title="审计链" description="审计记录只增不改，覆盖操作者、角色、动作、对象、前后状态、原因和请求标识。" />
    <Card title="完整操作证据" aside={<span className="version-badge">{state.auditEvents.length} 条事件</span>}><div className="audit-table"><div className="table-head"><span>时间 / 请求</span><span>操作者</span><span>对象</span><span>动作与结果</span></div>{[...state.auditEvents].reverse().map((item: any) => <div key={item.id}><span><strong>{time(item.createdAt)}</strong><small>{item.requestId}</small></span><span>{item.actorRole}<small>{item.actorId}</small></span><span>{item.objectType}<small>{item.objectId}</small></span><span><strong>{item.action}</strong><small>{item.before || "—"} → {item.after || "—"}{item.reason ? ` · ${item.reason}` : ""}</small></span></div>)}</div>{state.auditEvents.length === 0 && <Empty title="尚无审计事件" description="执行任一业务命令后，这里会追加不可修改的记录。" />}</Card>
  </>;
}
