import { JoinPanel } from "../components/JoinPanel";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function JoinPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />
      <main id="main-content">
        <section className="editorial-lead join-page-lead" data-reveal="up">
          <div className="editorial-lead-inner page-shell">
            <h1>让经验，再次参与真实工作</h1>
            <p>先留下您的专业方向与基本联系方式。完整经历、参与方式和时间安排，可以在后续沟通中补充。</p>
          </div>
        </section>
        <JoinPanel />
      </main>
      <SiteFooter />
    </>
  );
}
