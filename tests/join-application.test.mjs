import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_JOIN_NOTIFICATION_TO,
  formatJoinApplicationEmail,
  isHoneypotFilled,
  JoinApplicationError,
  parseJoinApplication,
} from "../src/join/application.mjs";

test("加入意向会规范化字段并使用已确认的联系人邮箱", () => {
  const application = parseJoinApplication({
    name: "  张老师  ",
    specialty: "设备管理\n与质量体系",
    contact: " 138 0000 0000 ",
    consent: true,
  });

  assert.deepEqual(application, {
    name: "张老师",
    specialty: "设备管理 与质量体系",
    contact: "138 0000 0000",
  });
  assert.equal(DEFAULT_JOIN_NOTIFICATION_TO, "mayonggang2021@gmail.com");
});

test("未确认隐私政策或字段超长时拒绝提交", () => {
  assert.throws(
    () => parseJoinApplication({ name: "张老师", specialty: "设备管理", contact: "13800000000" }),
    (error) => error instanceof JoinApplicationError && error.code === "CONSENT_REQUIRED",
  );
  assert.throws(
    () => parseJoinApplication({ name: "张".repeat(81), specialty: "设备管理", contact: "13800000000", consent: true }),
    (error) => error instanceof JoinApplicationError && error.code === "VALIDATION",
  );
});

test("邮件正文包含申请编号、提交时间和三项必要信息", () => {
  const text = formatJoinApplicationEmail(
    { name: "李老师", specialty: "工艺优化", contact: "微信：example" },
    { applicationId: "JOIN-12345678", submittedAt: "2026-09-21T08:00:00.000Z" },
  );

  assert.match(text, /JOIN-12345678/);
  assert.match(text, /李老师/);
  assert.match(text, /工艺优化/);
  assert.match(text, /微信：example/);
});

test("反机器人隐藏字段有内容时可识别", () => {
  assert.equal(isHoneypotFilled({ website: "https://spam.example" }), true);
  assert.equal(isHoneypotFilled({ website: "" }), false);
});
