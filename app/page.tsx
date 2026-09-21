import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { JoinPanel } from "./components/JoinPanel";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

const serviceModes = [
  {
    title: "专业咨询",
    description: "围绕一个明确问题，提供经验判断、方案讨论与专业建议。",
    note: "适合远程沟通与专题研判",
  },
  {
    title: "项目协作",
    description: "围绕既定目标参与评审、诊断与阶段推进，与团队共同解决问题。",
    note: "适合阶段支持与现场协作",
  },
  {
    title: "经验传承",
    description: "把多年实践经验转化为方法、规范与指导，帮助年轻团队成长。",
    note: "适合顾问支持与人才培养",
  },
];

const assuranceItems = [
  ["双方确认", "合作开始前，专家与需求方都能充分了解情况并确认参与意愿。"],
  ["边界清楚", "服务目标、参与方式和预期成果经过沟通后再进入下一步。"],
  ["信息受控", "个人资料与项目内容按需使用，不以公开展示代替必要沟通。"],
];

const heroSlices = ["hero-slice-1", "hero-slice-2", "hero-slice-3", "hero-slice-4"];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />

      <main id="main-content">
        <section className="story-hero" aria-labelledby="hero-title">
          <div className="story-hero-stage">
            <div className="story-hero-copy">
              <p className="story-hero-kicker">面向退休及临近退休的工程技术与管理人才</p>
              <h1 id="hero-title">
                <span>让经验，</span>
                <span>继续在一线</span>
                <span>发挥作用</span>
              </h1>
              <Link className="button button-primary" href="/join">
                申请加入专家网络 <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <figure
              className="story-hero-figure"
              role="img"
              aria-label="多位资深工程技术专业人士在创新工作室围绕项目交流"
            >
              {heroSlices.map((className, index) => (
                <span className={`story-hero-slice ${className}`} key={className}>
                  <span className="story-hero-photo">
                    <Image
                      src="/images/editorial/home-network-v2.png"
                      alt=""
                      aria-hidden="true"
                      fill
                      priority={index === 0}
                      sizes="(max-width: 760px) 80vw, 620px"
                    />
                  </span>
                </span>
              ))}
            </figure>

            <div className="story-hero-summary">
              <p>匠应达连接经验丰富的工程技术人才与真实产业需求。</p>
              <span aria-hidden="true" />
              <p>尊重专业经验，参与方式灵活，合作边界清晰，让专业能力继续产生价值。</p>
            </div>
          </div>
        </section>

        <section className="home-services" aria-labelledby="services-title" data-reveal="up">
          <div className="home-section-heading">
            <h2 id="services-title">经验不只一种用法</h2>
            <div>
              <p>从一次专业判断，到一段项目协作，让参与强度与您的时间安排相匹配。</p>
              <Link className="text-link" href="/services">完整了解服务方式 <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>

          <div className="service-panels">
            {serviceModes.map((service, index) => (
              <article key={service.title} className={`service-panel service-panel-${index + 1}`}>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <span>{service.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="home-assurance" aria-labelledby="assurance-title" data-reveal="left">
          <div className="assurance-statement">
            <ShieldCheck aria-hidden="true" />
            <h2 id="assurance-title">先把合作讲清楚，再开始工作</h2>
            <Link className="inverse-link" href="/assurance">了解项目保障 <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="assurance-rows">
            {assuranceItems.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-about" aria-labelledby="about-title" data-reveal="right">
          <div className="about-word" aria-hidden="true">经验</div>
          <div className="about-statement">
            <h2 id="about-title">连接经验，也连接真实需求</h2>
            <p className="about-lead">匠应达关注那些仍愿意分享判断、方法与实践经验的资深工程人才，也关注企业在真实项目中需要的专业支持。</p>
            <p>我们通过高校、学院与行业组织等渠道建立联系，让合适的人在合适的场景中继续贡献专业价值。</p>
            <Link className="text-link" href="/about">了解匠应达 <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>

        <JoinPanel />
      </main>

      <SiteFooter />
    </>
  );
}
