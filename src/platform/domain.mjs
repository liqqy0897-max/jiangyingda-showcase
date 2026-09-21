const ROLE_IDS = Object.freeze({
  enterprise: "ENT-001",
  expert: "EXP-023",
  consultant: "CON-004",
  admin: "ADM-001",
});

const clone = (value) => structuredClone(value);
const cents = (value, field) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DomainError("INVALID_AMOUNT", `${field} 必须是非负整数分（模拟数据）`, 400);
  }
  return value;
};

export class DomainError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const DEMO_ACTORS = Object.freeze({
  enterprise: Object.freeze({ id: ROLE_IDS.enterprise, role: "enterprise", name: "某某科技有限公司" }),
  expert: Object.freeze({ id: ROLE_IDS.expert, role: "expert", name: "专家 E-023" }),
  consultant: Object.freeze({ id: ROLE_IDS.consultant, role: "consultant", name: "服务顾问 G-004" }),
  admin: Object.freeze({ id: ROLE_IDS.admin, role: "admin", name: "平台管理员 A-001" }),
});

export function actorForRole(role) {
  const actor = DEMO_ACTORS[role];
  if (!actor) throw new DomainError("UNAUTHENTICATED", "演示身份无效，请重新选择角色。", 401);
  return actor;
}

export function createDemoState(now = new Date().toISOString()) {
  return {
    version: 1,
    counters: { demand: 24, invitation: 0, quote: 0, order: 0, project: 0, deliverable: 0, audit: 0, notice: 0, certification: 1, rate: 1, exception: 0 },
    rates: [{ id: "RATE-2026-09", version: 1, basisPoints: 1500, activeAt: now, createdBy: ROLE_IDS.admin }],
    people: [
      { id: ROLE_IDS.enterprise, role: "enterprise", name: "某某科技有限公司" },
      { id: ROLE_IDS.expert, role: "expert", name: "专家 E-023", certificationStatus: "verified", specialties: ["热处理", "工艺诊断"] },
      { id: "EXP-061", role: "expert", name: "专家 E-061", certificationStatus: "pending", specialties: ["生产优化"] },
      { id: ROLE_IDS.consultant, role: "consultant", name: "服务顾问 G-004" },
      { id: "CON-018", role: "consultant", name: "服务顾问 G-018" },
      { id: ROLE_IDS.admin, role: "admin", name: "平台管理员 A-001" },
    ],
    certifications: [
      { id: "CERT-000", expertId: ROLE_IDS.expert, status: "verified", summary: "演示专家能力资料已完成核验", createdAt: now, reviewedAt: now, reviewedBy: ROLE_IDS.admin, reviewReason: "演示认证基线", version: 1 },
      { id: "CERT-001", expertId: "EXP-061", status: "pending", summary: "演示认证材料待管理员核验", createdAt: now, version: 1 },
    ],
    demands: [{
      id: "D-2026-024", enterpriseId: ROLE_IDS.enterprise, title: "退火线温度波动诊断", problem: "退火线温度波动，批次间一致性需要复核。",
      objective: "完成诊断并提交参数优化建议。", timeline: "2026-10-01 至 2026-11-01", deliverable: "诊断报告与参数建议",
      acceptanceCriteria: "说明测量依据，关键温度波动收敛至 ±3℃。", dataPermissions: "仅开放脱敏参数与工艺摘要。",
      status: "submitted", assignedConsultantId: ROLE_IDS.consultant, slaDueAt: new Date(Date.parse(now) + 24 * 60 * 60 * 1000).toISOString(),
      slaStatus: "on_time", assignmentHistory: [{ from: null, to: ROLE_IDS.consultant, reason: "演示种子自动分配", actorId: "SYSTEM", createdAt: now }],
      verificationHistory: [], createdAt: now, version: 1,
    }],
    invitations: [],
    serviceOrders: [],
    projects: [],
    meetings: [],
    reminders: [],
    exceptions: [],
    notifications: [],
    auditEvents: [],
    idempotency: {},
  };
}

function requireActor(actor) {
  const expected = actor && DEMO_ACTORS[actor.role];
  if (!expected || expected.id !== actor.id) throw new DomainError("UNAUTHENTICATED", "演示身份无效，请重新登录。", 401);
  return expected;
}

function requireRole(actor, ...roles) {
  if (!roles.includes(actor.role)) throw new DomainError("FORBIDDEN", `此操作仅限${roles.join("、")}角色。`, 403);
}

function demandById(state, id) {
  const value = state.demands.find((item) => item.id === id);
  if (!value) throw new DomainError("NOT_FOUND", "未找到这条需求。", 404);
  return value;
}

function invitationById(state, id) {
  const value = state.invitations.find((item) => item.id === id);
  if (!value) throw new DomainError("NOT_FOUND", "未找到这条邀约。", 404);
  return value;
}

function orderById(state, id) {
  const value = state.serviceOrders.find((item) => item.id === id);
  if (!value) throw new DomainError("NOT_FOUND", "未找到这份服务单。", 404);
  return value;
}

function projectById(state, id) {
  const value = state.projects.find((item) => item.id === id);
  if (!value) throw new DomainError("NOT_FOUND", "未找到这个项目。", 404);
  return value;
}

function requireDemandOwner(demand, actor) {
  if (actor.role !== "enterprise" || demand.enterpriseId !== actor.id) {
    throw new DomainError("FORBIDDEN", "当前账号无此需求的企业操作权限。", 403);
  }
}

function requireAssignedConsultant(demand, actor) {
  if (actor.role !== "consultant" || demand.assignedConsultantId !== actor.id) {
    throw new DomainError("FORBIDDEN", "当前账号不是此需求的负责顾问。", 403);
  }
}

function requireProjectParty(project, actor) {
  if (actor.id !== project.enterpriseId && actor.id !== project.expertId && actor.id !== project.consultantId) {
    throw new DomainError("FORBIDDEN", "当前账号不属于这个项目。", 403);
  }
}

function nextId(state, key, prefix) {
  state.counters[key] += 1;
  return `${prefix}-${String(state.counters[key]).padStart(3, "0")}`;
}

function notice(recipientId, title, body, href, actionLabel, objectType, objectId) {
  return { recipientId, title, body, href, actionLabel, objectType, objectId };
}

function moneyTerms(input) {
  return {
    serviceAmount: cents(input.serviceAmount, "serviceAmount"),
    travel: cents(input.travel ?? 0, "travel"),
    tax: cents(input.tax ?? 0, "tax"),
    thirdParty: cents(input.thirdParty ?? 0, "thirdParty"),
  };
}

function quoteFor(invitation, version) {
  return invitation.quotes.find((item) => item.version === version);
}

function currentVersion(order) {
  return order.versions.find((item) => item.version === order.currentVersion);
}

function currentDeliverable(project) {
  if (!project.latestDeliverableVersionId) return null;
  return project.deliverableVersions.find((item) => item.id === project.latestDeliverableVersionId) ?? null;
}

function latestDeliverableEvent(project) {
  const current = currentDeliverable(project);
  if (!current) return null;
  return [...project.deliverableEvents].reverse().find((item) => item.deliverableVersionId === current.id) ?? null;
}

function feeSnapshot(state, order, version, now) {
  const rate = state.rates.at(-1);
  const terms = version.terms;
  const grossTotal = terms.serviceAmount + terms.travel + terms.tax + terms.thirdParty;
  const fee = Math.round((terms.serviceAmount * rate.basisPoints) / 10000);
  return {
    id: `FEE-${order.id}-V${version.version}`, orderId: order.id, orderVersion: version.version,
    serviceAmount: terms.serviceAmount, travel: terms.travel, tax: terms.tax, thirdParty: terms.thirdParty,
    grossTotal, rateVersion: rate.id, basisPoints: rate.basisPoints, fee, expertNet: terms.serviceAmount - fee, createdAt: now,
  };
}

function applyCommand(state, actor, command, now) {
  const type = command.type;
  const notices = [];
  let objectType = "Platform";
  let objectId = "demo";
  let before = null;
  let after = null;
  let reason = command.reason ?? "";
  let result = {};

  if (type === "submitDemand") {
    requireRole(actor, "enterprise", "consultant");
    const delegated = actor.role === "consultant";
    const delegationReason = String(command.delegationReason ?? "").trim();
    if (delegated && !delegationReason) throw new DomainError("VALIDATION", "顾问代录需求必须填写企业委托依据。", 400);
    const fields = ["title", "problem", "objective", "timeline", "deliverable", "acceptanceCriteria", "dataPermissions"];
    for (const field of fields) if (!String(command[field] ?? "").trim()) throw new DomainError("VALIDATION", `请填写${field}。`, 400);
    const id = nextId(state, "demand", "D-2026");
    const demand = {
      id, enterpriseId: delegated ? ROLE_IDS.enterprise : actor.id, submittedBy: actor.id, submittedByRole: actor.role,
      delegationReason: delegated ? delegationReason : null, title: String(command.title).trim(), problem: String(command.problem).trim(), objective: String(command.objective).trim(),
      timeline: String(command.timeline).trim(), deliverable: String(command.deliverable).trim(), acceptanceCriteria: String(command.acceptanceCriteria).trim(),
      dataPermissions: String(command.dataPermissions).trim(), status: "submitted", assignedConsultantId: ROLE_IDS.consultant,
      slaDueAt: new Date(Date.parse(now) + 24 * 60 * 60 * 1000).toISOString(), slaStatus: "on_time",
      assignmentHistory: [{ from: null, to: ROLE_IDS.consultant, reason: "提交后自动分配", actorId: "SYSTEM", createdAt: now }],
      verificationHistory: [], createdAt: now, version: 1,
    };
    state.demands.push(demand);
    if (delegated) reason = delegationReason;
    objectType = "Demand"; objectId = id; after = demand.status;
    notices.push(notice(demand.enterpriseId, delegated ? "顾问已按委托代录需求" : "需求已提交", `${demand.title} 已进入顾问核验队列。`, `/platform/demands/${id}`, "查看进度", objectType, id));
    notices.push(notice(ROLE_IDS.consultant, delegated ? "代录需求待本人核验" : "有新的需求待核验", `${demand.title} 等待核验。`, "/platform/consultant/queue", "领取核验", objectType, id));
    result = { demandId: id };
  } else if (type === "reviseDemand") {
    const demand = demandById(state, command.demandId);
    requireDemandOwner(demand, actor);
    if (demand.status !== "needs_supplement") throw new DomainError("INVALID_STATE", "只有待补充需求可以重新提交。", 409);
    const fields = ["problem", "objective", "timeline", "deliverable", "acceptanceCriteria", "dataPermissions"];
    const changed = fields.filter((field) => String(command[field] ?? "").trim());
    if (changed.length === 0) throw new DomainError("VALIDATION", "请至少补充一项需求信息。", 400);
    before = demand.status;
    for (const field of changed) demand[field] = String(command[field]).trim();
    demand.status = "submitted";
    demand.version += 1;
    demand.slaDueAt = new Date(Date.parse(now) + 24 * 60 * 60 * 1000).toISOString();
    demand.slaStatus = "on_time";
    objectType = "Demand"; objectId = demand.id; after = demand.status;
    notices.push(notice(demand.assignedConsultantId, "企业已补充需求", `${demand.title} 已重新提交，请再次核验。`, `/platform/demands/${demand.id}`, "重新核验", objectType, demand.id));
    notices.push(notice(demand.enterpriseId, "补充内容已提交", "需求重新进入顾问核验队列。", `/platform/demands/${demand.id}`, "查看进度", objectType, demand.id));
    result = { demandId: demand.id, status: demand.status, changedFields: changed };
  } else if (type === "transferConsultant" || type === "escalateDemandSla") {
    const demand = demandById(state, command.demandId);
    const escalation = type === "escalateDemandSla";
    if (escalation) requireRole(actor, "admin");
    else requireAssignedConsultant(demand, actor);
    const transferReason = String(reason).trim();
    if (!transferReason) throw new DomainError("VALIDATION", escalation ? "超时升级必须填写处理依据。" : "转派必须填写原因和交接说明。", 400);
    const targetId = String(command.newConsultantId ?? "CON-018").trim();
    const target = state.people.find((person) => person.id === targetId && person.role === "consultant");
    if (!target) throw new DomainError("NOT_FOUND", "未找到目标服务顾问。", 404);
    if (target.id === demand.assignedConsultantId) throw new DomainError("CONFLICT", "目标顾问已经是当前负责人。", 409);
    const previous = demand.assignedConsultantId;
    before = previous;
    demand.assignedConsultantId = target.id;
    demand.slaStatus = escalation ? "overdue_reassigned" : "reassigned";
    demand.version += 1;
    demand.assignmentHistory.push({ from: previous, to: target.id, reason: transferReason, actorId: actor.id, createdAt: now, kind: escalation ? "sla_escalation" : "manual_transfer" });
    objectType = "Demand"; objectId = demand.id; after = target.id;
    notices.push(notice(demand.enterpriseId, escalation ? "需求超时已升级并调整顾问" : "需求负责顾问已调整", `${previous} → ${target.id}；${transferReason}`, `/platform/demands/${demand.id}`, "查看调整", objectType, demand.id));
    notices.push(notice(previous, escalation ? "需求超时已回池重分" : "需求已完成转派", transferReason, `/platform/demands/${demand.id}`, "查看交接", objectType, demand.id));
    notices.push(notice(target.id, escalation ? "收到超时升级需求" : "收到转派需求", `${demand.title}；${transferReason}`, `/platform/demands/${demand.id}`, "接续处理", objectType, demand.id));
    result = { demandId: demand.id, previousConsultantId: previous, consultantId: target.id, slaStatus: demand.slaStatus };
  } else if (type === "reviewDemand") {
    const demand = demandById(state, command.demandId);
    requireAssignedConsultant(demand, actor);
    if (!["submitted", "needs_supplement"].includes(demand.status)) throw new DomainError("INVALID_STATE", "此需求当前不能核验。", 409);
    if (!["verify", "request_supplement"].includes(command.decision)) throw new DomainError("VALIDATION", "请选择核验通过或退回补充。", 400);
    if (command.decision === "request_supplement" && !String(reason).trim()) throw new DomainError("VALIDATION", "退回补充必须写明缺口。", 400);
    before = demand.status;
    demand.status = command.decision === "verify" ? "verified" : "needs_supplement";
    demand.version += 1;
    demand.verificationHistory.push({ status: demand.status, reviewerId: actor.id, reason: String(reason).trim(), createdAt: now, version: demand.version });
    objectType = "Demand"; objectId = demand.id; after = demand.status;
    notices.push(notice(demand.enterpriseId, demand.status === "verified" ? "需求已核验" : "需求需要补充", demand.status === "verified" ? "可以查看候选专家并发送邀约。" : String(reason).trim(), `/platform/demands/${demand.id}`, demand.status === "verified" ? "查看候选" : "补充需求", objectType, demand.id));
    notices.push(notice(actor.id, "核验记录已保存", `${demand.title}：${demand.status === "verified" ? "核验通过" : "退回补充"}。`, `/platform/demands/${demand.id}`, "查看记录", objectType, demand.id));
    result = { demandId: demand.id, status: demand.status };
  } else if (type === "sendInvitation") {
    const demand = demandById(state, command.demandId);
    const delegated = actor.role === "consultant";
    if (delegated) {
      requireAssignedConsultant(demand, actor);
      const delegationReason = String(command.delegationReason ?? "").trim();
      if (!delegationReason) throw new DomainError("VALIDATION", "顾问代发邀约必须填写企业委托依据。", 400);
      reason = delegationReason;
    } else {
      requireDemandOwner(demand, actor);
    }
    if (demand.status !== "verified") throw new DomainError("INVALID_STATE", "需求须先由服务顾问核验通过，才能邀约专家。", 409);
    if (command.dataAccessConfirmed !== true) throw new DomainError("VALIDATION", "发送前请确认资料授权范围。", 400);
    const expert = state.people.find((person) => person.id === command.expertId && person.role === "expert");
    if (!expert) throw new DomainError("NOT_FOUND", "未找到该专家。", 404);
    if (expert.certificationStatus !== "verified") throw new DomainError("INVALID_STATE", "专家认证尚未通过，不能发送邀约。", 409);
    if (state.invitations.some((item) => item.demandId === demand.id && item.expertId === expert.id)) throw new DomainError("CONFLICT", "该专家已收到此需求的邀约。", 409);
    const id = nextId(state, "invitation", "INV");
    const invitation = {
      id, demandId: demand.id, enterpriseId: demand.enterpriseId, expertId: expert.id,
      consultantId: demand.assignedConsultantId, status: "sent", dataAccessConfirmedAt: now,
      sentBy: actor.id, sentByRole: actor.role, delegationReason: delegated ? reason : null,
      quotes: [], createdAt: now, version: 1,
    };
    state.invitations.push(invitation);
    objectType = "Invitation"; objectId = id; after = invitation.status;
    notices.push(notice(expert.id, "收到项目邀约", `${demand.title} 邀请你查看并响应。`, `/platform/invitations/${id}`, "查看邀约", objectType, id));
    if (delegated) {
      notices.push(notice(demand.enterpriseId, "顾问已按委托发送专家邀约", `${demand.title} 已由负责顾问代发；委托依据已进入审计。`, `/platform/invitations/${id}`, "查看邀约", objectType, id));
      notices.push(notice(actor.id, "代发邀约记录已保存", `${demand.title} 的委托依据与操作人已记录。`, `/platform/invitations/${id}`, "查看进度", objectType, id));
    } else {
      notices.push(notice(demand.assignedConsultantId, "企业已发送专家邀约", `${demand.title} 的邀约进入监督。`, `/platform/invitations/${id}`, "查看进度", objectType, id));
    }
    result = { invitationId: id };
  } else if (type === "respondInvitation") {
    const invitation = invitationById(state, command.invitationId);
    if (actor.role !== "expert" || invitation.expertId !== actor.id) throw new DomainError("FORBIDDEN", "只有受邀专家本人可以响应。", 403);
    if (invitation.status !== "sent") throw new DomainError("INVALID_STATE", "此邀约已不能响应。", 409);
    if (!["accept", "decline"].includes(command.decision)) throw new DomainError("VALIDATION", "请选择接受或拒绝。", 400);
    before = invitation.status;
    invitation.status = command.decision === "accept" ? "accepted" : "declined";
    invitation.version += 1;
    objectType = "Invitation"; objectId = invitation.id; after = invitation.status;
    const demand = demandById(state, invitation.demandId);
    notices.push(notice(invitation.enterpriseId, "专家已响应邀约", `${demand.title}：${invitation.status === "accepted" ? "接受邀约" : "拒绝邀约"}。`, `/platform/invitations/${invitation.id}`, "查看协商", objectType, invitation.id));
    notices.push(notice(invitation.consultantId, "邀约状态已更新", `${demand.title} 的专家已响应。`, `/platform/invitations/${invitation.id}`, "查看监督", objectType, invitation.id));
    result = { invitationId: invitation.id, status: invitation.status };
  } else if (type === "submitQuote" || type === "counterQuote") {
    const invitation = invitationById(state, command.invitationId);
    const demand = demandById(state, invitation.demandId);
    if (type === "submitQuote") {
      if (actor.role !== "expert" || invitation.expertId !== actor.id) throw new DomainError("FORBIDDEN", "只有受邀专家本人可以报价。", 403);
      if (!["accepted", "quoted", "negotiating"].includes(invitation.status)) throw new DomainError("INVALID_STATE", "请先接受邀约，或检查邀约是否仍有效。", 409);
    } else {
      requireDemandOwner(demand, actor);
      if (!["quoted", "negotiating"].includes(invitation.status)) throw new DomainError("INVALID_STATE", "当前邀约还没有可反报价的专家报价。", 409);
    }
    const amounts = moneyTerms(command);
    if (amounts.serviceAmount <= 0) throw new DomainError("VALIDATION", "serviceAmount 必须大于零。", 400);
    const quote = { id: nextId(state, "quote", "Q"), version: invitation.quotes.length + 1, submittedBy: actor.id, submittedByRole: actor.role, ...amounts, scope: String(command.scope ?? demand.deliverable).trim(), timeline: String(command.timeline ?? demand.timeline).trim(), createdAt: now };
    invitation.quotes.push(quote);
    invitation.status = "negotiating";
    invitation.version += 1;
    objectType = "Invitation"; objectId = invitation.id; after = invitation.status;
    const recipientId = actor.role === "expert" ? invitation.enterpriseId : invitation.expertId;
    notices.push(notice(recipientId, actor.role === "expert" ? "专家已提交报价" : "企业已提交反报价", `报价 V${quote.version} 已生成，旧版本保留只读。`, `/platform/invitations/${invitation.id}`, "查看最新报价", objectType, invitation.id));
    notices.push(notice(invitation.consultantId, "报价版本已更新", `邀约 ${invitation.id} 新增报价 V${quote.version}。`, `/platform/invitations/${invitation.id}`, "查看协商", objectType, invitation.id));
    result = { invitationId: invitation.id, quoteVersion: quote.version };
  } else if (type === "selectInvitation") {
    const invitation = invitationById(state, command.invitationId);
    const demand = demandById(state, invitation.demandId);
    requireDemandOwner(demand, actor);
    if (demand.status !== "verified") throw new DomainError("INVALID_STATE", "只有已核验需求可以选定专家。", 409);
    if (demand.selectedInvitationId) throw new DomainError("CONFLICT", "此需求已经选定专家。", 409);
    const latest = invitation.quotes.at(-1);
    if (!latest || latest.version !== command.quoteVersion) throw new DomainError("CONFLICT", "报价版本已变化，请刷新后重新选择。", 409);
    if (!["negotiating", "quoted"].includes(invitation.status)) throw new DomainError("INVALID_STATE", "当前邀约不能被选定。", 409);
    demand.selectedInvitationId = invitation.id;
    demand.version += 1;
    invitation.status = "selected";
    invitation.version += 1;
    for (const other of state.invitations) {
      if (other.demandId === demand.id && other.id !== invitation.id && ["sent", "accepted", "quoted", "negotiating"].includes(other.status)) {
        other.status = "closed_unselected";
        other.closedReason = "enterprise_selected_another_expert";
        other.closedByInvitationId = invitation.id;
        other.closedAt = now;
        other.version += 1;
        notices.push(notice(other.expertId, "本次邀约已结束", "企业已完成专家选定；不会向你展示中选报价。", `/platform/invitations/${other.id}`, "查看结果", "Invitation", other.id));
      }
    }
    objectType = "Invitation"; objectId = invitation.id; after = invitation.status;
    notices.push(notice(invitation.expertId, "企业已选定你", "服务顾问将根据最新协商内容建立服务单。", `/platform/invitations/${invitation.id}`, "查看结果", objectType, invitation.id));
    notices.push(notice(invitation.consultantId, "专家已选定，待建立服务单", `${demand.title} 已完成选定。`, `/platform/invitations/${invitation.id}`, "建立服务单", objectType, invitation.id));
    result = { invitationId: invitation.id, status: invitation.status };
  } else if (type === "createServiceOrder") {
    const invitation = invitationById(state, command.invitationId);
    const demand = demandById(state, invitation.demandId);
    requireAssignedConsultant(demand, actor);
    if (invitation.status !== "selected") throw new DomainError("INVALID_STATE", "企业尚未选定此邀约。", 409);
    if (state.serviceOrders.some((item) => item.invitationId === invitation.id)) throw new DomainError("CONFLICT", "此邀约已建立服务单。", 409);
    const quote = quoteFor(invitation, command.quoteVersion ?? invitation.quotes.at(-1)?.version);
    if (!quote || quote.version !== invitation.quotes.at(-1)?.version) throw new DomainError("CONFLICT", "只能从最新报价建立服务单。", 409);
    const id = nextId(state, "order", "SO");
    const terms = {
      scope: String(command.scope ?? quote.scope ?? demand.deliverable).trim(), serviceAmount: quote.serviceAmount,
      travel: quote.travel, tax: quote.tax, thirdParty: quote.thirdParty, timeline: String(command.timeline ?? quote.timeline ?? demand.timeline).trim(),
      acceptanceCriteria: String(command.acceptanceCriteria ?? demand.acceptanceCriteria).trim(),
    };
    const orderVersion = { version: 1, terms, createdBy: actor.id, reason: "根据企业选定的最新报价建立服务单。", createdAt: now, invalidatedAt: null, confirmations: { enterprise: null, expert: null }, status: "awaiting_confirmation" };
    const order = { id, demandId: demand.id, invitationId: invitation.id, enterpriseId: demand.enterpriseId, expertId: invitation.expertId, consultantId: actor.id, currentVersion: 1, status: "awaiting_confirmation", versions: [orderVersion] };
    state.serviceOrders.push(order);
    objectType = "ServiceOrder"; objectId = id; after = order.status;
    for (const recipientId of [order.enterpriseId, order.expertId]) notices.push(notice(recipientId, "服务单待本人确认", `请查看服务单 V1 的范围、时间、验收与费用快照。`, `/platform/service-orders/${id}`, "查看并确认", objectType, id));
    result = { orderId: id, version: 1 };
  } else if (type === "reviseServiceOrder") {
    const order = orderById(state, command.orderId);
    const demand = demandById(state, order.demandId);
    requireAssignedConsultant(demand, actor);
    if (!String(reason).trim()) throw new DomainError("VALIDATION", "创建新版本必须说明变更原因。", 400);
    if (["terminated", "cancelled"].includes(order.status)) throw new DomainError("INVALID_STATE", "已终止或取消的服务单不能修改。", 409);
    const prior = currentVersion(order);
    const terms = { ...prior.terms, ...command.terms };
    for (const field of ["scope", "timeline", "acceptanceCriteria"]) terms[field] = String(terms[field] ?? "").trim();
    Object.assign(terms, moneyTerms(terms));
    if (!terms.scope || !terms.timeline || !terms.acceptanceCriteria || terms.serviceAmount <= 0) throw new DomainError("VALIDATION", "新服务单版本的范围、时间、验收标准和服务金额均为必填。", 400);
    const priorVersion = prior.version;
    before = prior.status;
    prior.invalidatedAt = now;
    prior.status = "invalidated";
    const version = priorVersion + 1;
    order.versions.push({ version, terms, createdBy: actor.id, reason: String(reason).trim(), createdAt: now, invalidatedAt: null, confirmations: { enterprise: null, expert: null }, status: "awaiting_confirmation" });
    order.currentVersion = version;
    order.status = "awaiting_confirmation";
    const project = state.projects.find((item) => item.orderId === order.id);
    if (project) { project.status = "change_pending"; project.pendingOrderVersion = version; }
    objectType = "ServiceOrder"; objectId = order.id; after = order.status;
    for (const recipientId of [order.enterpriseId, order.expertId]) notices.push(notice(recipientId, `服务单更新至 V${version}`, `旧版本确认已失效：${String(reason).trim()}`, `/platform/service-orders/${order.id}`, "查看差异并确认", objectType, order.id));
    result = { orderId: order.id, version };
  } else if (type === "confirmServiceOrder") {
    const order = orderById(state, command.orderId);
    const version = currentVersion(order);
    const partyRole = actor.id === order.enterpriseId ? "enterprise" : actor.id === order.expertId ? "expert" : null;
    if (!partyRole) throw new DomainError("FORBIDDEN", "只有关联企业和中选专家本人可以确认服务单。", 403);
    if (command.version !== order.currentVersion) throw new DomainError("CONFLICT", "该服务单版本已失效，请查看最新版本。", 409);
    if (version.status !== "awaiting_confirmation") throw new DomainError("INVALID_STATE", "此版本当前不能确认。", 409);
    if (version.confirmations[partyRole]) throw new DomainError("CONFLICT", "你已确认此版本。", 409);
    before = version.status;
    version.confirmations[partyRole] = { actorId: actor.id, role: partyRole, version: version.version, createdAt: now, digest: `${order.id}:V${version.version}:${actor.id}` };
    if (version.confirmations.enterprise && version.confirmations.expert) {
      version.status = "confirmed";
      order.status = "confirmed";
      if (!state.feeSnapshots) state.feeSnapshots = [];
      if (!state.feeSnapshots.some((item) => item.orderId === order.id && item.orderVersion === version.version)) state.feeSnapshots.push(feeSnapshot(state, order, version, now));
      const project = state.projects.find((item) => item.orderId === order.id);
      if (project) { project.status = "in_progress"; project.orderVersion = version.version; delete project.pendingOrderVersion; }
    }
    objectType = "ServiceOrder"; objectId = order.id; after = version.status;
    const waitingRole = partyRole === "enterprise" ? "expert" : "enterprise";
    const waitingActorId = waitingRole === "enterprise" ? order.enterpriseId : order.expertId;
    if (after === "confirmed") {
      for (const recipientId of [order.enterpriseId, order.expertId, order.consultantId]) notices.push(notice(recipientId, "服务单双方已确认", `V${version.version} 确认完成，费用快照已冻结。`, `/platform/service-orders/${order.id}`, "进入项目", objectType, order.id));
    } else notices.push(notice(waitingActorId, "服务单等待你的确认", `${actor.name} 已确认 V${version.version}。`, `/platform/service-orders/${order.id}`, "确认此版本", objectType, order.id));
    result = { orderId: order.id, version: version.version, status: version.status };
  } else if (type === "createProject") {
    const order = orderById(state, command.orderId);
    const demand = demandById(state, order.demandId);
    requireAssignedConsultant(demand, actor);
    const version = currentVersion(order);
    if (order.status !== "confirmed" || version.status !== "confirmed" || !version.confirmations.enterprise || !version.confirmations.expert) throw new DomainError("INVALID_STATE", "只有双方确认同一最新服务单版本后才能创建项目。", 409);
    if (state.projects.some((item) => item.orderId === order.id)) throw new DomainError("CONFLICT", "该服务单已经创建项目。", 409);
    const projectId = nextId(state, "project", "PJ-2026");
    const project = { id: projectId, orderId: order.id, orderVersion: version.version, demandId: order.demandId, enterpriseId: order.enterpriseId, expertId: order.expertId, consultantId: order.consultantId, status: "in_progress", version: 1, milestones: [{ id: `${projectId}-M1`, title: "诊断与成果交付", status: "in_progress", dueAt: version.terms.timeline }], deliverableVersions: [], deliverableEvents: [], latestDeliverableVersionId: null, evaluation: null, createdAt: now };
    state.projects.push(project);
    demand.projectId = projectId;
    objectType = "Project"; objectId = projectId; after = project.status;
    for (const recipientId of [project.enterpriseId, project.expertId, project.consultantId]) notices.push(notice(recipientId, "项目已建立", `${demand.title} 进入项目履约，需求页将只读显示项目派生状态。`, `/platform/projects/${projectId}`, "进入项目", objectType, projectId));
    result = { projectId };
  } else if (type === "submitDeliverable") {
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.expertId) throw new DomainError("FORBIDDEN", "只有项目专家可以提交或补交成果。", 403);
    if (project.status !== "in_progress") throw new DomainError("INVALID_STATE", "项目当前不接受成果提交。", 409);
    const priorEvent = latestDeliverableEvent(project);
    if (priorEvent && !["withdrawn", "returned", "supplement_requested"].includes(priorEvent.status)) throw new DomainError("INVALID_STATE", "当前成果还在验收中或已通过，不能重复提交。", 409);
    const content = String(command.content ?? "").trim();
    if (!content) throw new DomainError("VALIDATION", "成果说明不能为空。", 400);
    const version = project.deliverableVersions.length + 1;
    const deliverableId = nextId(state, "deliverable", "DEL");
    project.deliverableVersions.push({ id: deliverableId, version, content, submittedBy: actor.id, createdAt: now });
    project.latestDeliverableVersionId = deliverableId;
    project.deliverableEvents.push({ id: `${deliverableId}-SUBMITTED`, deliverableVersionId: deliverableId, status: "submitted", actorId: actor.id, reason: "", createdAt: now });
    project.milestones[0].status = "awaiting_acceptance";
    project.version += 1;
    objectType = "Deliverable"; objectId = deliverableId; after = "submitted";
    for (const recipientId of [project.enterpriseId, project.consultantId]) notices.push(notice(recipientId, "专家已提交成果", `成果 V${version} 待企业验收。`, `/platform/projects/${project.id}`, "去验收", objectType, project.id));
    result = { deliverableId, version };
  } else if (type === "withdrawDeliverable") {
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.expertId) throw new DomainError("FORBIDDEN", "只有项目专家本人可以撤回成果。", 403);
    const latest = currentDeliverable(project);
    const latestEvent = latestDeliverableEvent(project);
    if (!latest || !latestEvent || latestEvent.status !== "submitted") throw new DomainError("INVALID_STATE", "当前成果已被处理，不能撤回。", 409);
    if (!String(reason).trim()) throw new DomainError("VALIDATION", "撤回成果必须说明原因。", 400);
    project.deliverableEvents.push({ id: `${latest.id}-WITHDRAWN-${project.deliverableEvents.length + 1}`, deliverableVersionId: latest.id, status: "withdrawn", actorId: actor.id, reason: String(reason).trim(), createdAt: now });
    project.milestones[0].status = "in_progress";
    project.version += 1;
    objectType = "Deliverable"; objectId = latest.id; before = "submitted"; after = "withdrawn";
    for (const recipientId of [project.enterpriseId, project.consultantId]) notices.push(notice(recipientId, "专家撤回了成果", String(reason).trim(), `/platform/projects/${project.id}`, "查看原因", objectType, project.id));
    result = { deliverableId: latest.id, status: "withdrawn" };
  } else if (type === "decideDeliverable") {
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.enterpriseId) throw new DomainError("FORBIDDEN", "只有企业本人可以验收成果。", 403);
    const latest = currentDeliverable(project);
    const latestEvent = latestDeliverableEvent(project);
    if (!latest || !latestEvent || latestEvent.status !== "submitted" || project.milestones[0].status !== "awaiting_acceptance") throw new DomainError("INVALID_STATE", "没有可验收的当前成果版本。", 409);
    if (!["accept", "return", "request_supplement"].includes(command.decision)) throw new DomainError("VALIDATION", "请选择通过、退回或要求补充。", 400);
    if (command.decision !== "accept" && !String(reason).trim()) throw new DomainError("VALIDATION", "退回或要求补充必须填写具体依据。", 400);
    before = latestEvent.status;
    const status = command.decision === "accept" ? "accepted" : command.decision === "return" ? "returned" : "supplement_requested";
    project.deliverableEvents.push({ id: `${latest.id}-${status}-${project.deliverableEvents.length + 1}`, deliverableVersionId: latest.id, status, actorId: actor.id, reason: String(reason).trim(), createdAt: now });
    project.milestones[0].status = status === "accepted" ? "accepted" : status;
    if (status === "accepted") project.status = "completed";
    project.version += 1;
    objectType = "Deliverable"; objectId = latest.id; after = status;
    for (const recipientId of [project.expertId, project.consultantId]) notices.push(notice(recipientId, status === "accepted" ? "企业已验收通过" : status === "returned" ? "成果已退回" : "企业要求补充成果", status === "accepted" ? "项目已完成。" : String(reason).trim(), `/platform/projects/${project.id}`, status === "accepted" ? "查看项目" : "补交成果", objectType, project.id));
    result = { deliverableId: latest.id, status, projectStatus: project.status };
  } else if (type === "evaluateProject") {
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.enterpriseId) throw new DomainError("FORBIDDEN", "只有企业本人可以提交评价。", 403);
    if (project.status !== "completed") throw new DomainError("INVALID_STATE", "项目完成后才开放评价。", 409);
    if (project.evaluation) throw new DomainError("CONFLICT", "评价已提交，不能覆盖；如需处理请联系治理人员。", 409);
    if (!Number.isInteger(command.rating) || command.rating < 1 || command.rating > 5) throw new DomainError("VALIDATION", "评价星级须为 1 至 5。", 400);
    project.evaluation = { rating: command.rating, comment: String(command.comment ?? "").trim(), actorId: actor.id, createdAt: now };
    project.version += 1;
    objectType = "Project"; objectId = project.id; after = project.status;
    notices.push(notice(project.expertId, "企业已提交项目评价", "评价已保存为只读记录。", `/platform/projects/${project.id}`, "查看项目", objectType, project.id));
    result = { projectId: project.id, rating: command.rating };
  } else if (type === "submitCertification") {
    requireRole(actor, "expert");
    if (actor.id !== "EXP-061") throw new DomainError("INVALID_STATE", "当前演示专家已通过认证。", 409);
    const summary = String(command.summary ?? "").trim();
    if (!summary) throw new DomainError("VALIDATION", "请填写不含敏感证件信息的材料摘要。", 400);
    const latest = [...state.certifications].reverse().find((item) => item.expertId === actor.id);
    const record = { id: nextId(state, "certification", "CERT"), expertId: actor.id, status: "pending", summary, createdAt: now, version: (latest?.version ?? 0) + 1 };
    state.certifications.push(record);
    objectType = "Certification"; objectId = record.id; after = record.status;
    notices.push(notice(ROLE_IDS.admin, "有专家认证待审核", `${actor.name} 提交了认证材料摘要。`, "/platform/admin/certifications", "审核认证", objectType, record.id));
    notices.push(notice(actor.id, "认证材料已提交", "等待管理员审核，不要提交真实敏感证件。", "/platform/expert/certification", "查看状态", objectType, record.id));
    result = { certificationId: record.id };
  } else if (type === "reviewCertification") {
    requireRole(actor, "admin");
    const record = state.certifications.find((item) => item.id === command.certificationId);
    if (!record) throw new DomainError("NOT_FOUND", "未找到认证记录。", 404);
    if (record.status !== "pending") throw new DomainError("INVALID_STATE", "此认证记录已处理。", 409);
    if (!["approve", "request_supplement"].includes(command.decision)) throw new DomainError("VALIDATION", "请选择通过或退回补充。", 400);
    if (command.decision === "request_supplement" && !String(reason).trim()) throw new DomainError("VALIDATION", "退回补充必须记录依据。", 400);
    before = record.status;
    record.status = command.decision === "approve" ? "verified" : "needs_supplement";
    record.reviewedBy = actor.id; record.reviewReason = String(reason).trim(); record.reviewedAt = now;
    const person = state.people.find((item) => item.id === record.expertId);
    if (person) person.certificationStatus = record.status === "verified" ? "verified" : "pending";
    objectType = "Certification"; objectId = record.id; after = record.status;
    notices.push(notice(record.expertId, record.status === "verified" ? "专家认证已通过" : "认证材料需要补充", record.reviewReason || "管理员已审核演示材料摘要。", "/platform/expert/certification", "查看审核结果", objectType, record.id));
    result = { certificationId: record.id, status: record.status };
  } else if (type === "recordMeeting") {
    requireRole(actor, "consultant");
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.consultantId) throw new DomainError("FORBIDDEN", "只有项目监督顾问可以记录纪要。", 403);
    const summary = String(command.summary ?? "").trim();
    if (!summary) throw new DomainError("VALIDATION", "纪要内容不能为空。", 400);
    const meeting = { id: `MIN-${state.meetings.length + 1}`, projectId: project.id, actorId: actor.id, summary, createdAt: now };
    state.meetings.push(meeting);
    objectType = "Meeting"; objectId = meeting.id; after = "recorded";
    for (const recipientId of [project.enterpriseId, project.expertId]) notices.push(notice(recipientId, "顾问记录了项目纪要", summary, `/platform/projects/${project.id}`, "查看纪要", objectType, meeting.id));
    result = { meetingId: meeting.id };
  } else if (type === "remindProject") {
    requireRole(actor, "consultant");
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.consultantId) throw new DomainError("FORBIDDEN", "只有项目监督顾问可以发送提醒。", 403);
    const targetRole = command.targetRole;
    if (!["enterprise", "expert"].includes(targetRole)) throw new DomainError("VALIDATION", "提醒对象必须是项目企业或专家。", 400);
    const message = String(command.message ?? "").trim();
    if (!message) throw new DomainError("VALIDATION", "提醒内容不能为空。", 400);
    const recipientId = targetRole === "enterprise" ? project.enterpriseId : project.expertId;
    const reminder = { id: `REM-${state.reminders.length + 1}`, projectId: project.id, actorId: actor.id, recipientId, targetRole, message, createdAt: now };
    state.reminders.push(reminder);
    objectType = "Reminder"; objectId = reminder.id; before = project.status; after = project.status;
    notices.push(notice(recipientId, "顾问发送了项目提醒", message, `/platform/projects/${project.id}`, "查看项目", objectType, reminder.id));
    result = { reminderId: reminder.id, projectStatus: project.status };
  } else if (type === "pauseProject" || type === "resumeProject") {
    requireRole(actor, "consultant");
    const project = projectById(state, command.projectId);
    requireProjectParty(project, actor);
    if (actor.id !== project.consultantId) throw new DomainError("FORBIDDEN", "只有项目监督顾问可以暂停或恢复项目。", 403);
    const pauseReason = String(reason).trim();
    if (!pauseReason) throw new DomainError("VALIDATION", type === "pauseProject" ? "暂停项目必须填写风险或双方请求依据。" : "恢复项目必须填写处理依据。", 400);
    if (type === "pauseProject" && !["in_progress", "change_pending"].includes(project.status)) throw new DomainError("INVALID_STATE", "项目当前不能暂停。", 409);
    if (type === "resumeProject" && project.status !== "paused") throw new DomainError("INVALID_STATE", "只有暂停中的项目可以恢复。", 409);
    before = project.status;
    project.status = type === "pauseProject" ? "paused" : (project.statusBeforePause ?? "in_progress");
    if (type === "pauseProject") project.statusBeforePause = before;
    else delete project.statusBeforePause;
    project.version += 1;
    project.pauseHistory = project.pauseHistory ?? [];
    project.pauseHistory.push({ action: type === "pauseProject" ? "paused" : "resumed", actorId: actor.id, reason: pauseReason, createdAt: now });
    objectType = "Project"; objectId = project.id; after = project.status;
    for (const recipientId of [project.enterpriseId, project.expertId]) notices.push(notice(recipientId, type === "pauseProject" ? "项目已暂停" : "项目已恢复", pauseReason, `/platform/projects/${project.id}`, "查看影响", objectType, project.id));
    result = { projectId: project.id, status: project.status };
  } else if (type === "governException") {
    requireRole(actor, "admin");
    if (!String(reason).trim()) throw new DomainError("VALIDATION", "治理决定必须填写依据。", 400);
    const exception = { id: nextId(state, "exception", "EXC"), objectType: String(command.objectType ?? "Platform"), objectId: String(command.objectId ?? "demo"), decision: String(command.decision ?? "review"), reason: String(reason).trim(), actorId: actor.id, createdAt: now, status: "recorded" };
    state.exceptions.push(exception);
    objectType = "Exception"; objectId = exception.id; after = exception.status;
    result = { exceptionId: exception.id };
  } else if (type === "publishRate") {
    requireRole(actor, "admin");
    if (!Number.isInteger(command.basisPoints) || command.basisPoints < 0 || command.basisPoints > 10000) throw new DomainError("VALIDATION", "费率须为 0 至 100%。", 400);
    if (!String(reason).trim()) throw new DomainError("VALIDATION", "发布新费率必须写明原因。", 400);
    const rate = { id: `RATE-2026-${String(state.counters.rate + 1).padStart(2, "0")}`, version: state.rates.length + 1, basisPoints: command.basisPoints, activeAt: now, createdBy: actor.id, reason: String(reason).trim() };
    state.counters.rate += 1; state.rates.push(rate);
    objectType = "Rate"; objectId = rate.id; after = `V${rate.version}`;
    result = { rateId: rate.id, version: rate.version };
  } else if (type === "markNotificationRead" || type === "markNotificationHandled") {
    const item = state.notifications.find((entry) => entry.id === command.notificationId && entry.recipientId === actor.id);
    if (!item) throw new DomainError("NOT_FOUND", "没有找到属于当前账号的通知。", 404);
    const field = type === "markNotificationRead" ? "readAt" : "handledAt";
    if (!item[field]) item[field] = now;
    objectType = "Notification"; objectId = item.id; after = field === "readAt" ? "read" : "handled";
    result = { notificationId: item.id, readAt: item.readAt ?? null, handledAt: item.handledAt ?? null };
  } else {
    throw new DomainError("NOT_FOUND", `不支持的业务命令：${String(type ?? "")}`, 404);
  }

  return { objectType, objectId, before, after, reason: String(reason).trim(), notices, result };
}

function authorizedSnapshot(state, actor) {
  const snapshot = clone(state);
  const demandIds = new Set();
  const orderIds = new Set();
  const projectIds = new Set();
  const invitationIds = new Set();

  if (actor.role === "enterprise") {
    for (const demand of snapshot.demands) if (demand.enterpriseId === actor.id) demandIds.add(demand.id);
  } else if (actor.role === "consultant") {
    for (const demand of snapshot.demands) if (demand.assignedConsultantId === actor.id) demandIds.add(demand.id);
  }

  if (actor.role === "enterprise" || actor.role === "consultant") {
    for (const invitation of snapshot.invitations) if (demandIds.has(invitation.demandId)) invitationIds.add(invitation.id);
  } else if (actor.role === "expert") {
    for (const invitation of snapshot.invitations) if (invitation.expertId === actor.id) invitationIds.add(invitation.id);
  }
  if (actor.role === "enterprise" || actor.role === "consultant") {
    for (const order of snapshot.serviceOrders) if (demandIds.has(order.demandId)) orderIds.add(order.id);
  } else if (actor.role === "expert") {
    for (const order of snapshot.serviceOrders) if (order.expertId === actor.id) orderIds.add(order.id);
  }
  for (const project of snapshot.projects) {
    if (actor.role === "admin" || project.enterpriseId === actor.id || project.expertId === actor.id || project.consultantId === actor.id) projectIds.add(project.id);
  }

  if (actor.role !== "admin") {
    snapshot.demands = snapshot.demands.filter((item) => demandIds.has(item.id));
    snapshot.invitations = snapshot.invitations.filter((item) => invitationIds.has(item.id));
    if (actor.role === "expert") {
      for (const invitation of snapshot.invitations) {
        if (invitation.status === "closed_unselected") invitation.quotes = [];
      }
      snapshot.certifications = snapshot.certifications.filter((item) => item.expertId === actor.id);
      snapshot.people = snapshot.people.filter((item) => item.id === actor.id || item.id === ROLE_IDS.enterprise || item.id === ROLE_IDS.consultant);
    } else {
      snapshot.certifications = [];
      snapshot.people = snapshot.people.filter((item) => item.role === "expert" || item.id === actor.id || item.id === ROLE_IDS.consultant);
    }
    snapshot.serviceOrders = snapshot.serviceOrders.filter((item) => orderIds.has(item.id));
    snapshot.projects = snapshot.projects.filter((item) => projectIds.has(item.id));
    snapshot.feeSnapshots = (snapshot.feeSnapshots ?? []).filter((item) => orderIds.has(item.orderId));
    snapshot.rates = snapshot.rates.slice(-1);
    snapshot.auditEvents = snapshot.auditEvents.filter((item) => item.actorId === actor.id || demandIds.has(item.objectId) || invitationIds.has(item.objectId) || orderIds.has(item.objectId) || projectIds.has(item.objectId));
    snapshot.exceptions = [];
    snapshot.meetings = snapshot.meetings.filter((item) => projectIds.has(item.projectId));
    snapshot.reminders = snapshot.reminders.filter((item) => projectIds.has(item.projectId));
  }
  snapshot.notifications = snapshot.notifications.filter((item) => item.recipientId === actor.id);
  return snapshot;
}

export function createDemoEngine({ initialState = createDemoState(), clock = () => new Date().toISOString() } = {}) {
  let state = clone(initialState);

  return {
    snapshot(actorInput) {
      const actor = requireActor(actorInput);
      return authorizedSnapshot(state, actor);
    },
    execute(actorInput, request) {
      const actor = requireActor(actorInput);
      const { command, expectedVersion, idempotencyKey } = request ?? {};
      if (!command || typeof command !== "object" || typeof command.type !== "string") throw new DomainError("VALIDATION", "业务命令格式无效。", 400);
      if (!Number.isSafeInteger(expectedVersion)) throw new DomainError("VALIDATION", "每个业务命令都必须提供 expectedVersion。", 400);
      if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length < 8 || idempotencyKey.length > 120) throw new DomainError("VALIDATION", "每个业务命令都必须提供有效 idempotencyKey。", 400);
      const signature = JSON.stringify({ actorId: actor.id, command });
      const replay = state.idempotency[`${actor.id}:${idempotencyKey}`];
      if (replay) {
        if (replay.signature !== signature) throw new DomainError("IDEMPOTENCY_CONFLICT", "此幂等键已用于不同命令。", 409);
        return { ...clone(replay.response), replayed: true };
      }
      if (expectedVersion !== state.version) throw new DomainError("VERSION_CONFLICT", "数据已被其他操作更新，请刷新后重试。", 409, { expectedVersion, currentVersion: state.version });

      const draft = clone(state);
      let applied;
      try {
        applied = applyCommand(draft, actor, command, clock());
      } catch (error) {
        if (error instanceof DomainError && error.status === 403) {
          state.counters.audit += 1;
          state.version += 1;
          state.auditEvents.push({ id: `AUD-${String(state.counters.audit).padStart(4, "0")}`, objectType: "Security", objectId: command.demandId ?? command.projectId ?? command.orderId ?? command.invitationId ?? "demo", action: "AccessDenied", actorId: actor.id, actorRole: actor.role, reason: error.message, requestId: idempotencyKey, createdAt: clock() });
        }
        throw error;
      }

      draft.version += 1;
      draft.counters.audit += 1;
      draft.auditEvents.push({ id: `AUD-${String(draft.counters.audit).padStart(4, "0")}`, objectType: applied.objectType, objectId: applied.objectId, action: command.type, actorId: actor.id, actorRole: actor.role, before: applied.before, after: applied.after, reason: applied.reason, requestId: idempotencyKey, createdAt: clock() });
      for (const item of applied.notices) {
        draft.counters.notice += 1;
        draft.notifications.push({ id: `MSG-${String(draft.counters.notice).padStart(4, "0")}`, eventId: `AUD-${String(draft.counters.audit).padStart(4, "0")}`, ...item, createdAt: clock(), readAt: null, handledAt: null });
      }
      const response = { version: draft.version, result: applied.result, replayed: false };
      draft.idempotency[`${actor.id}:${idempotencyKey}`] = { signature, response: clone(response) };
      state = draft;
      return response;
    },
  };
}

export const platformEngine = createDemoEngine();
