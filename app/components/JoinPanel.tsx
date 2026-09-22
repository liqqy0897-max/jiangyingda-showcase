"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

const emptyDraft = { name: "", specialty: "", contact: "" };

export function JoinPanel() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(emptyDraft);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          website: formData.get("website"),
          consent: formData.get("consent") === "on",
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error?.message || "加入意向未能发送，请稍后重试。");
      }

      form.reset();
      setDraft(emptyDraft);
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "加入意向未能发送，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="join" id="join" aria-labelledby="join-title" data-reveal="up">
      <div className="join-layout">
        <div className="join-copy">
          <h2 id="join-title">把您的专业方向，告诉我们</h2>
          <p>如果您拥有长期工程实践、技术管理或项目经验，并希望以更灵活的方式继续参与专业工作，欢迎留下加入意向。</p>
          <ul>
            <li><Check aria-hidden="true" /> 退休或临近退休的工程技术人才</li>
            <li><Check aria-hidden="true" /> 拥有可说明的专业领域与实践经历</li>
            <li><Check aria-hidden="true" /> 愿意按自身情况参与咨询、项目或带教</li>
          </ul>
        </div>

        <form className="join-form" aria-busy={submitting} onSubmit={handleSubmit}>
          {submitted ? (
            <div className="form-success" role="status">
              <ShieldCheck aria-hidden="true" />
              <h3>加入意向已发送</h3>
              <p>联系人已收到您填写的信息，我们会通过您留下的联系方式与您沟通。当前不会自动创建 MVP 平台账号。</p>
              <button className="button button-secondary" type="button" onClick={() => setSubmitted(false)}>继续填写</button>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <h3>加入专家库</h3>
                <p>先留下三项基本信息，完整资料可在后续沟通中补充。</p>
              </div>
              <label>
                您的称呼
                <input name="name" autoComplete="name" maxLength={80} placeholder="例如：张老师" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </label>
              <label>
                熟悉的专业方向
                <input name="specialty" maxLength={160} placeholder="例如：设备管理、工艺优化、质量体系" required value={draft.specialty} onChange={(event) => setDraft({ ...draft, specialty: event.target.value })} />
              </label>
              <label>
                联系方式
                <input name="contact" autoComplete="tel" maxLength={120} placeholder="手机、微信或邮箱" required value={draft.contact} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} />
              </label>
              <label className="join-trap" aria-hidden="true">
                公司网站
                <input name="website" autoComplete="off" tabIndex={-1} />
              </label>
              <label className="form-consent">
                <input name="consent" type="checkbox" required />
                <span>我已阅读并同意<Link href="/privacy">隐私政策</Link>，同意将上述信息发送给联系人用于加入意向核实与后续沟通。</span>
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button className="button button-primary form-submit" type="submit" disabled={submitting}>
                {submitting ? "正在发送…" : "提交加入意向"} {!submitting ? <ArrowRight aria-hidden="true" /> : null}
              </button>
              <p className="form-disclaimer">提交后，信息将发送至指定联系人邮箱；当前不会自动同步到 MVP 平台或创建账号。</p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
