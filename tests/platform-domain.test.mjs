import test from "node:test";
import assert from "node:assert/strict";
import { actorForRole, createDemoEngine, createDemoState, DomainError } from "../src/platform/domain.mjs";

const actors = Object.fromEntries(["enterprise", "expert", "consultant", "admin"].map((role) => [role, actorForRole(role)]));
let keyNumber = 0;
const request = (command, expectedVersion, key = undefined) => ({ command, expectedVersion, idempotencyKey: key ?? `test-request-${++keyNumber}` });
const act = (engine, role, command, key = undefined) => engine.execute(actors[role], request(command, engine.snapshot(actors[role]).version, key));
const expectCode = (fn, code) => assert.throws(fn, (error) => error instanceof DomainError && error.code === code);

function prepareSelected(engine, expertId = "EXP-023") {
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  if (expertId === "EXP-061") {
    act(engine, "admin", { type: "reviewCertification", certificationId: "CERT-001", decision: "approve", reason: "演示材料完整" });
  }
  const invite = act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId, dataAccessConfirmed: true }).result.invitationId;
  act(engine, "expert", { type: "respondInvitation", invitationId: invite, decision: "accept" });
  act(engine, "expert", { type: "submitQuote", invitationId: invite, serviceAmount: 1920000, travel: 180000, tax: 0, thirdParty: 0 });
  act(engine, "enterprise", { type: "selectInvitation", invitationId: invite, quoteVersion: 1 });
  return invite;
}

function prepareProject(engine) {
  const invitationId = prepareSelected(engine);
  const orderId = act(engine, "consultant", { type: "createServiceOrder", invitationId }).result.orderId;
  act(engine, "enterprise", { type: "confirmServiceOrder", orderId, version: 1 });
  act(engine, "expert", { type: "confirmServiceOrder", orderId, version: 1 });
  const projectId = act(engine, "consultant", { type: "createProject", orderId }).result.projectId;
  return { invitationId, orderId, projectId };
}

test("核验前拒绝邀约；只有负责顾问可核验并生成只读核验记录", () => {
  const engine = createDemoEngine();
  expectCode(() => act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true }), "INVALID_STATE");
  expectCode(() => act(engine, "expert", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" }), "FORBIDDEN");
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  const demand = engine.snapshot(actors.enterprise).demands[0];
  assert.equal(demand.status, "verified");
  assert.equal(demand.verificationHistory.length, 1);
});

test("企业可按退回依据补充需求；顾问代录必须携带委托依据", () => {
  const engine = createDemoEngine();
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "request_supplement", reason: "缺少复核证据要求" });
  act(engine, "enterprise", { type: "reviseDemand", demandId: "D-2026-024", acceptanceCriteria: "补充：附测量记录与复核签字" });
  assert.equal(engine.snapshot(actors.enterprise).demands[0].status, "submitted");
  expectCode(() => act(engine, "consultant", { type: "submitDemand", title: "代录需求", problem: "问题", objective: "目标", timeline: "十个工作日", deliverable: "报告", acceptanceCriteria: "形成签字记录", dataPermissions: "脱敏数据" }), "VALIDATION");
  const demandId = act(engine, "consultant", { type: "submitDemand", title: "代录需求", problem: "问题", objective: "目标", timeline: "十个工作日", deliverable: "报告", acceptanceCriteria: "形成签字记录", dataPermissions: "脱敏数据", delegationReason: "企业工单 ENT-WT-025" }).result.demandId;
  const delegated = engine.snapshot(actors.enterprise).demands.find((item) => item.id === demandId);
  assert.equal(delegated.submittedByRole, "consultant");
  assert.equal(delegated.delegationReason, "企业工单 ENT-WT-025");
});

test("认证未通过的专家不能受邀；管理员审核认证但不能代替业务确认", () => {
  const engine = createDemoEngine();
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  expectCode(() => act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-061", dataAccessConfirmed: true }), "INVALID_STATE");
  act(engine, "admin", { type: "reviewCertification", certificationId: "CERT-001", decision: "approve", reason: "材料已核验" });
  const invite = act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-061", dataAccessConfirmed: true }).result.invitationId;
  const invitation = engine.snapshot(actors.admin).invitations.find((item) => item.id === invite);
  assert.equal(invitation.status, "sent");
  expectCode(() => act(engine, "admin", { type: "confirmServiceOrder", orderId: "SO-001", version: 1 }), "NOT_FOUND");
});

test("受托顾问可代发邀约，但必须记录委托依据和发送主体", () => {
  const engine = createDemoEngine();
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  expectCode(() => act(engine, "consultant", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true }), "VALIDATION");
  const invitationId = act(engine, "consultant", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true, delegationReason: "企业工单 ENT-WT-024 明确委托顾问代发" }).result.invitationId;
  const invitation = engine.snapshot(actors.enterprise).invitations.find((item) => item.id === invitationId);
  assert.equal(invitation.sentBy, actors.consultant.id);
  assert.equal(invitation.sentByRole, "consultant");
  assert.equal(invitation.delegationReason, "企业工单 ENT-WT-024 明确委托顾问代发");
  assert.ok(engine.snapshot(actors.enterprise).notifications.some((item) => item.objectId === invitationId && item.title.includes("顾问已按委托")));
});

test("顾问转派和超时升级保存交接、企业通知与审计", () => {
  const transferEngine = createDemoEngine();
  act(transferEngine, "consultant", { type: "transferConsultant", demandId: "D-2026-024", newConsultantId: "CON-018", reason: "原顾问休假，已交接核验重点" });
  let demand = transferEngine.snapshot(actors.enterprise).demands[0];
  assert.equal(demand.assignedConsultantId, "CON-018");
  assert.equal(demand.assignmentHistory.at(-1).kind, "manual_transfer");
  assert.ok(transferEngine.snapshot(actors.enterprise).notifications.some((item) => item.title.includes("负责顾问已调整")));

  const slaEngine = createDemoEngine();
  act(slaEngine, "admin", { type: "escalateDemandSla", demandId: "D-2026-024", newConsultantId: "CON-018", reason: "超过核验 SLA，自动回池后重分" });
  demand = slaEngine.snapshot(actors.enterprise).demands[0];
  assert.equal(demand.slaStatus, "overdue_reassigned");
  assert.equal(demand.assignmentHistory.at(-1).kind, "sla_escalation");
  assert.ok(slaEngine.snapshot(actors.admin).auditEvents.some((item) => item.action === "escalateDemandSla" && item.reason.includes("SLA")));
});

test("完整主链：报价只增、双确认版本冻结費用、补交验收与评价", () => {
  const engine = createDemoEngine();
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  const invitationId = act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true }).result.invitationId;
  act(engine, "expert", { type: "respondInvitation", invitationId, decision: "accept" });
  act(engine, "expert", { type: "submitQuote", invitationId, serviceAmount: 1920000, travel: 180000, tax: 0, thirdParty: 0 });
  act(engine, "expert", { type: "submitQuote", invitationId, serviceAmount: 2000000, travel: 180000, tax: 12000, thirdParty: 8000 });
  const invitation = engine.snapshot(actors.expert).invitations[0];
  assert.equal(invitation.quotes.length, 2);
  assert.equal(invitation.quotes[0].serviceAmount, 1920000);
  act(engine, "enterprise", { type: "selectInvitation", invitationId, quoteVersion: 2 }).result;
  const orderId = act(engine, "consultant", { type: "createServiceOrder", invitationId }).result.orderId;
  act(engine, "enterprise", { type: "confirmServiceOrder", orderId, version: 1 });
  expectCode(() => act(engine, "consultant", { type: "createProject", orderId }), "INVALID_STATE");
  act(engine, "expert", { type: "confirmServiceOrder", orderId, version: 1 });
  let order = engine.snapshot(actors.enterprise).serviceOrders[0];
  const fee = engine.snapshot(actors.enterprise).feeSnapshots[0];
  assert.deepEqual([fee.serviceAmount, fee.travel, fee.tax, fee.thirdParty, fee.grossTotal, fee.fee, fee.expertNet], [2000000, 180000, 12000, 8000, 2200000, 300000, 1700000]);
  act(engine, "consultant", { type: "reviseServiceOrder", orderId, reason: "验收标准补充说明", terms: { acceptanceCriteria: "加入测量记录，波动不超过 ±3℃" } });
  order = engine.snapshot(actors.enterprise).serviceOrders[0];
  assert.equal(order.currentVersion, 2);
  assert.equal(order.versions[0].status, "invalidated");
  assert.deepEqual(order.versions[0].confirmations, { enterprise: { actorId: actors.enterprise.id, role: "enterprise", version: 1, createdAt: order.versions[0].confirmations.enterprise.createdAt, digest: `${orderId}:V1:${actors.enterprise.id}` }, expert: { actorId: actors.expert.id, role: "expert", version: 1, createdAt: order.versions[0].confirmations.expert.createdAt, digest: `${orderId}:V1:${actors.expert.id}` } });
  expectCode(() => act(engine, "enterprise", { type: "confirmServiceOrder", orderId, version: 1 }), "CONFLICT");
  act(engine, "enterprise", { type: "confirmServiceOrder", orderId, version: 2 });
  act(engine, "expert", { type: "confirmServiceOrder", orderId, version: 2 });
  const projectId = act(engine, "consultant", { type: "createProject", orderId }).result.projectId;
  act(engine, "expert", { type: "submitDeliverable", projectId, content: "诊断报告 V1" });
  const expertSnapshot = engine.snapshot(actors.expert);
  const currentId = expertSnapshot.projects[0].latestDeliverableVersionId;
  act(engine, "expert", { type: "withdrawDeliverable", projectId, reason: "需要复核一项测量数据" });
  assert.equal(engine.snapshot(actors.enterprise).projects[0].deliverableEvents.at(-1).status, "withdrawn");
  act(engine, "expert", { type: "submitDeliverable", projectId, content: "诊断报告 V2" });
  act(engine, "enterprise", { type: "decideDeliverable", projectId, decision: "request_supplement", reason: "请补充测量记录" });
  act(engine, "expert", { type: "submitDeliverable", projectId, content: "诊断报告 V3，含测量记录" });
  act(engine, "enterprise", { type: "decideDeliverable", projectId, decision: "accept" });
  act(engine, "enterprise", { type: "evaluateProject", projectId, rating: 5, comment: "演示评价" });
  const result = engine.snapshot(actors.enterprise);
  const project = result.projects[0];
  assert.equal(project.status, "completed");
  assert.equal(project.deliverableVersions.find((item) => item.id === currentId).content, "诊断报告 V1");
  assert.equal(project.deliverableEvents.length, 6);
  assert.equal(project.evaluation.rating, 5);
  assert.equal(result.feeSnapshots.length, 2, "服务单 V1、V2 的费用快照均保留");
  assert.equal(result.feeSnapshots[0].fee, 300000);
  assert.equal(result.feeSnapshots[1].serviceAmount, 2000000);
});

test("顾问提醒不改变项目状态；暂停会阻止交付，恢复有完整记录", () => {
  const engine = createDemoEngine();
  const { projectId } = prepareProject(engine);
  act(engine, "consultant", { type: "remindProject", projectId, targetRole: "expert", message: "里程碑将在三天后到期" });
  assert.equal(engine.snapshot(actors.consultant).projects[0].status, "in_progress");
  act(engine, "consultant", { type: "pauseProject", projectId, reason: "双方请求暂停等待补充数据" });
  expectCode(() => act(engine, "expert", { type: "submitDeliverable", projectId, content: "暂停期间成果" }), "INVALID_STATE");
  act(engine, "consultant", { type: "resumeProject", projectId, reason: "补充数据已就绪，双方同意恢复" });
  const project = engine.snapshot(actors.consultant).projects[0];
  assert.equal(project.status, "in_progress");
  assert.deepEqual(project.pauseHistory.map((item) => item.action), ["paused", "resumed"]);
  assert.equal(engine.snapshot(actors.consultant).reminders.length, 1);
});

test("企业选定后其他有效邀约礼貌关闭；需求继续只保存项目引用", () => {
  const engine = createDemoEngine();
  act(engine, "admin", { type: "reviewCertification", certificationId: "CERT-001", decision: "approve", reason: "演示材料完整" });
  act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" });
  const winnerId = act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true }).result.invitationId;
  const loserId = act(engine, "enterprise", { type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-061", dataAccessConfirmed: true }).result.invitationId;
  act(engine, "expert", { type: "respondInvitation", invitationId: winnerId, decision: "accept" });
  act(engine, "expert", { type: "submitQuote", invitationId: winnerId, serviceAmount: 1920000, travel: 0, tax: 0, thirdParty: 0 });
  act(engine, "enterprise", { type: "selectInvitation", invitationId: winnerId, quoteVersion: 1 });
  const loser = engine.snapshot(actors.admin).invitations.find((item) => item.id === loserId);
  assert.equal(loser.status, "closed_unselected");
  assert.equal(loser.closedReason, "enterprise_selected_another_expert");
  assert.equal(loser.closedByInvitationId, winnerId);
  const orderId = act(engine, "consultant", { type: "createServiceOrder", invitationId: winnerId }).result.orderId;
  act(engine, "enterprise", { type: "confirmServiceOrder", orderId, version: 1 });
  act(engine, "expert", { type: "confirmServiceOrder", orderId, version: 1 });
  const projectId = act(engine, "consultant", { type: "createProject", orderId }).result.projectId;
  const snapshot = engine.snapshot(actors.enterprise);
  assert.equal(snapshot.demands[0].projectId, projectId);
  assert.equal(snapshot.demands[0].status, "verified", "需求原状态不被二次推进，页面从项目派生当前状态");
  assert.equal(snapshot.projects.find((item) => item.id === projectId).status, "in_progress");
});

test("重放幂等键只返回原结果；过期版本冲突不覆盖；已读不等于已处理", () => {
  const engine = createDemoEngine();
  const key = "fixed-idempotency-001";
  const first = act(engine, "consultant", { type: "reviewDemand", demandId: "D-2026-024", decision: "verify" }, key);
  const replay = engine.execute(actors.consultant, request({ type: "reviewDemand", demandId: "D-2026-024", decision: "verify" }, 1, key));
  assert.equal(replay.replayed, true);
  assert.equal(replay.version, first.version);
  assert.equal(engine.snapshot(actors.enterprise).demands[0].verificationHistory.length, 1);
  expectCode(() => engine.execute(actors.enterprise, request({ type: "sendInvitation", demandId: "D-2026-024", expertId: "EXP-023", dataAccessConfirmed: true }, 1)), "VERSION_CONFLICT");
  const msg = engine.snapshot(actors.enterprise).notifications[0];
  act(engine, "enterprise", { type: "markNotificationRead", notificationId: msg.id });
  const read = engine.snapshot(actors.enterprise).notifications.find((item) => item.id === msg.id);
  assert.ok(read.readAt);
  assert.equal(read.handledAt, null);
  act(engine, "enterprise", { type: "markNotificationHandled", notificationId: msg.id });
  const handled = engine.snapshot(actors.enterprise).notifications.find((item) => item.id === msg.id);
  assert.ok(handled.readAt);
  assert.ok(handled.handledAt);
});

test("管理员越权命令返回 403 并追加安全审计，项目外顾问不能验收", () => {
  const engine = createDemoEngine();
  const { orderId, projectId } = prepareProject(engine);
  const adminBefore = engine.snapshot(actors.admin).auditEvents.length;
  expectCode(() => act(engine, "admin", { type: "confirmServiceOrder", orderId, version: 1 }), "FORBIDDEN");
  expectCode(() => act(engine, "consultant", { type: "decideDeliverable", projectId, decision: "accept" }), "FORBIDDEN");
  const audit = engine.snapshot(actors.admin).auditEvents;
  assert.ok(audit.length >= adminBefore + 2);
  assert.equal(audit.filter((event) => event.action === "AccessDenied").length, 2);
});
