export const DEFAULT_JOIN_NOTIFICATION_TO = "mayonggang2021@gmail.com";

export class JoinApplicationError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "JoinApplicationError";
    this.code = code;
    this.status = status;
  }
}

const fields = {
  name: { label: "称呼", min: 1, max: 80 },
  specialty: { label: "专业方向", min: 2, max: 160 },
  contact: { label: "联系方式", min: 3, max: 120 },
};

function readText(input, key) {
  const rule = fields[key];
  const value = typeof input[key] === "string" ? input[key].replace(/\s+/g, " ").trim() : "";

  if (value.length < rule.min) {
    throw new JoinApplicationError("VALIDATION", `请填写有效的${rule.label}。`);
  }

  if (value.length > rule.max) {
    throw new JoinApplicationError("VALIDATION", `${rule.label}不能超过 ${rule.max} 个字符。`);
  }

  return value;
}

export function isHoneypotFilled(input) {
  if (!input || typeof input !== "object") return false;
  const website = input.website;
  return typeof website === "string" && website.trim().length > 0;
}

export function parseJoinApplication(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new JoinApplicationError("INVALID_REQUEST", "提交内容格式无效。");
  }

  if (input.consent !== true) {
    throw new JoinApplicationError("CONSENT_REQUIRED", "请先确认已阅读隐私政策。", 400);
  }

  return {
    name: readText(input, "name"),
    specialty: readText(input, "specialty"),
    contact: readText(input, "contact"),
  };
}

export function formatJoinApplicationEmail(application, metadata) {
  return [
    "收到一条新的专家库加入意向。",
    "",
    `申请编号：${metadata.applicationId}`,
    `提交时间：${metadata.submittedAt}`,
    `称呼：${application.name}`,
    `专业方向：${application.specialty}`,
    `联系方式：${application.contact}`,
    "",
    "来源：匠应达公开网站加入专家库表单",
  ].join("\n");
}
