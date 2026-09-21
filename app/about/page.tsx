import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

const values = [
  ["尊重专业", "资深工程人才不是被动的履历资源，而是仍能作出判断、分享方法并参与真实工作的专业人士。"],
  ["务实连接", "连接从具体的专业方向和真实需求出发，不用空泛标签替代必要沟通。"],
  ["长期价值", "让经验被继续使用，也让年轻团队在实际协作中获得方法与视角。"],
];

export default function AboutPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />
      <main id="main-content">
        <section className="editorial-lead" data-reveal="up">
          <div className="editorial-lead-inner page-shell">
            <h1>让有经验的人，继续站在问题身边</h1>
            <p>匠应达连接资深专业人才与真实产业需求，也连接经验、方法和下一代工程团队。</p>
          </div>
        </section>

        <section className="about-editorial-feature" aria-labelledby="about-purpose-title" data-reveal="left">
          <div className="about-editorial-feature-grid page-shell">
            <figure className="about-editorial-feature-media">
              <Image
                src="/images/editorial/about-network-v1.png"
                alt="不同年龄的工程技术专业人士在创新空间边走边交流"
                fill
                sizes="(max-width: 760px) calc(100vw - 36px), 54vw"
              />
            </figure>
            <div className="about-editorial-feature-copy">
              <h2 id="about-purpose-title">我们相信，专业价值不会因为退休而停止</h2>
              <p>匠应达关注那些仍愿意分享判断、方法与实践经验的资深工程人才，也关注企业在真实项目中需要的专业支持。</p>
              <p>我们通过高校、学院与行业组织等渠道建立联系，让合适的人在合适的场景中继续贡献专业价值。</p>
            </div>
          </div>
        </section>

        <section className="about-values" aria-labelledby="about-values-title" data-reveal="right">
          <div className="about-value-mosaic page-shell">
            <div className="about-value-intro">
              <h2 id="about-values-title">我们的价值取向</h2>
            </div>
            {values.map(([title, description], index) => (
              <article className={`about-value-cell about-value-${index + 1}`} key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-audience-lock" aria-label="服务对象" data-reveal="left">
          <article>
            <h2>面向资深专业人才</h2>
            <p>退休或临近退休，拥有长期工程实践、技术管理或项目经验，并希望继续参与专业工作。</p>
          </article>
          <article>
            <h2>面向真实产业需求</h2>
            <p>需要专业判断、项目协作或经验传承支持，但不需要把问题包装成复杂流程。</p>
          </article>
        </section>

        <section className="editorial-cta" data-reveal="up">
          <div className="editorial-cta-inner page-shell">
            <h2>让经验再次参与真实工作</h2>
            <div>
              <p>先留下您的专业方向，让一次合适的连接从这里开始。</p>
              <Link className="button button-dark" href="/join">留下加入意向 <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
