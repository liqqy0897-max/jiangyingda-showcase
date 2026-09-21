import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

const principles = [
  {
    title: "双方确认",
    description: "合作开始前，专家与需求方都能充分了解情况并确认参与意愿。",
    detail: "不以系统推荐代替本人的判断，也不在条件尚未明确时推进合作。",
  },
  {
    title: "边界清楚",
    description: "服务目标、参与方式和预期成果经过沟通后再进入下一步。",
    detail: "让专业意见在适合的范围内发挥作用，也让各方对合作有一致预期。",
  },
  {
    title: "信息受控",
    description: "个人资料与项目内容按需使用，不以公开展示代替必要沟通。",
    detail: "未获授权的信息不作为公开内容，项目交流遵循必要、适度的原则。",
  },
];

export default function AssurancePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />
      <main id="main-content">
        <section className="editorial-lead" data-reveal="up">
          <div className="editorial-lead-inner page-shell">
            <h1>把专业合作，建立在清楚之上</h1>
            <p>项目保障不是一句承诺，而是让双方在开始前看见条件、边界与信息使用方式。</p>
          </div>
        </section>

        <section className="assurance-lock" aria-label="项目保障主张" data-reveal="left">
          <article className="assurance-lock-dark">
            <h2>先确认</h2>
            <p>{principles[0].description}</p>
          </article>
          <article className="assurance-lock-light">
            <h2>再协作</h2>
            <p>服务目标、参与方式和预期成果经过沟通后，再进入下一步。</p>
          </article>
        </section>

        <section className="assurance-principles" aria-labelledby="assurance-principles-title" data-reveal="right">
          <div className="page-shell">
            <div className="editorial-section-heading">
              <h2 id="assurance-principles-title">三项保障原则</h2>
              <span aria-hidden="true" />
            </div>
            <div className="assurance-principle-grid">
              <figure className="assurance-principle-image">
                <Image
                  src="/images/editorial/assurance-review-v1.png"
                  alt="资深工程专家与项目负责人在现场共同复核工程图纸"
                  fill
                  sizes="(max-width: 760px) calc(100vw - 36px), 38vw"
                />
              </figure>
              <div className="assurance-principle-list">
                {principles.map((principle) => (
                  <article key={principle.title}>
                    <h3>{principle.title}</h3>
                    <div>
                      <p>{principle.description}</p>
                      <span>{principle.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-cta" data-reveal="up">
          <div className="editorial-cta-inner page-shell">
            <h2>合作的第一步，是彼此了解</h2>
            <div>
              <p>如果您愿意继续贡献专业经验，可以先留下方向，我们再进行后续沟通。</p>
              <Link className="button button-primary" href="/join">留下加入意向 <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
