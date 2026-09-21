"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export function JoinPanel() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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

        <form className="join-form" onSubmit={handleSubmit}>
          {submitted ? (
            <div className="form-success" role="status">
              <ShieldCheck aria-hidden="true" />
              <h3>申请界面已完成演示</h3>
              <p>当前版本不会上传您的信息。正式申请通道接入后，页面会明确展示隐私说明与后续联系安排。</p>
              <button className="button button-secondary" type="button" onClick={() => setSubmitted(false)}>返回填写</button>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <h3>申请加入</h3>
                <p>先留下三项基本信息，完整资料可在后续沟通中补充。</p>
              </div>
              <label>
                您的称呼
                <input name="name" autoComplete="name" placeholder="例如：张老师" required />
              </label>
              <label>
                熟悉的专业方向
                <input name="specialty" placeholder="例如：设备管理、工艺优化、质量体系" required />
              </label>
              <label>
                联系方式
                <input name="contact" autoComplete="tel" inputMode="tel" placeholder="手机或微信" required />
              </label>
              <button className="button button-primary form-submit" type="submit">
                提交加入意向 <ArrowRight aria-hidden="true" />
              </button>
              <p className="form-disclaimer">前端预览版本：提交仅演示交互，不会发送或保存信息。</p>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
