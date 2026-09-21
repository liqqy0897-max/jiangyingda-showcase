import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

const modes = [
  {
    title: "专业咨询",
    lead: "围绕一个明确问题，提供经验判断、方案讨论与专业建议。",
    body: "适合需要快速听取专业意见、复核思路或梳理关键问题的场景。参与可以从一次集中沟通开始。",
    note: "远程沟通 · 专题研判",
    tone: "cyan",
  },
  {
    title: "项目协作",
    lead: "围绕既定目标参与评审、诊断与阶段推进，与团队共同解决问题。",
    body: "适合需要持续一段时间、结合资料与现场情况推进的专业任务。具体参与方式由双方沟通确认。",
    note: "阶段支持 · 现场协作",
    tone: "mint",
  },
  {
    title: "经验传承",
    lead: "把多年实践经验转化为方法、规范与指导，帮助年轻团队成长。",
    body: "适合技术复盘、人才培养和专业方法传递，让个人经验成为团队可以继续使用的能力。",
    note: "顾问支持 · 人才培养",
    tone: "mist",
  },
];

export default function ServicesPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />
      <main id="main-content">
        <section className="editorial-lead" data-reveal="up">
          <div className="editorial-lead-inner page-shell">
            <h1>经验，可以用在不同的时刻</h1>
            <p>不是回到一份固定工作，而是在合适的问题、时间和参与强度下继续贡献专业判断。</p>
          </div>
        </section>

        <section className="editorial-feature" aria-labelledby="services-feature-title" data-reveal="left">
          <figure className="editorial-feature-media">
            <Image
              src="/images/editorial/services-collaboration-v1.png"
              alt="资深工程专家与年轻技术人员围绕机械部件和图纸开展协作"
              fill
              sizes="(max-width: 760px) calc(100vw - 36px), 56vw"
            />
          </figure>
          <div className="editorial-feature-copy">
            <h2 id="services-feature-title">参与强度由场景决定，也由您选择</h2>
            <p>服务方式不是固定岗位说明。我们先了解问题，再与专家本人确认时间、地点和适合的参与方式。</p>
          </div>
        </section>

        <section className="editorial-section-intro page-shell" aria-labelledby="services-list-title" data-reveal="up">
          <div className="editorial-section-heading">
            <h2 id="services-list-title">三种服务方式</h2>
            <span aria-hidden="true" />
          </div>
          <p>围绕清楚的问题建立连接，让经验以合适的深度进入真实项目。</p>
        </section>

        <section className="service-mode-flow" aria-label="三种服务方式">
          {modes.map((mode) => (
            <article
              className={`service-mode-row service-mode-${mode.tone}`}
              data-reveal={mode.tone === "mint" ? "right" : "left"}
              key={mode.title}
            >
              <div className="service-mode-name">
                <h2>{mode.title}</h2>
                <span>{mode.note}</span>
              </div>
              <div className="service-mode-detail">
                <strong>{mode.lead}</strong>
                <p>{mode.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="editorial-cta" data-reveal="up">
          <div className="editorial-cta-inner page-shell">
            <h2>从一次合适的参与开始</h2>
            <div>
              <p>先告诉我们您的专业方向，完整经历和参与偏好可以在后续沟通中补充。</p>
              <Link className="button button-primary" href="/join">留下加入意向 <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
