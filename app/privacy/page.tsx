import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "隐私政策｜匠应达",
  description: "了解匠应达如何处理网站访问、加入意向和主动联系过程中涉及的信息。",
};

export default function PrivacyPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <SiteHeader />
      <main id="main-content">
        <section className="editorial-lead privacy-lead" data-reveal="up">
          <div className="editorial-lead-inner page-shell">
            <h1>隐私政策</h1>
            <div className="privacy-lead-copy">
              <p>我们只在提供服务、回应咨询和保障网站安全所必需的范围内处理信息，并尽量让处理方式清楚、克制、可查询。</p>
              <span>更新日期：2026年9月21日</span>
            </div>
          </div>
        </section>

        <section className="privacy-policy" aria-label="隐私政策正文">
          <div className="privacy-policy-grid page-shell">
            <aside className="privacy-policy-summary">
              <h2>先说明当前网站的实际情况</h2>
              <p>当前公开网站以信息展示为主。加入意向表单仅演示前端交互，填写和提交的内容不会上传至服务器，也不会被我们保存。</p>
              <p>如果您主动通过页脚所列电话或邮箱联系我们，我们会按本政策处理您在沟通中提供的信息。</p>
            </aside>

            <article className="privacy-policy-body">
              <section>
                <h2>一、适用范围</h2>
                <p>本政策适用于您访问匠应达网站，以及通过网站公布的电话、邮箱与我们联系的情形。对于第三方网站或服务，其信息处理规则由相应第三方另行说明。</p>
              </section>

              <section>
                <h2>二、我们可能处理的信息</h2>
                <h3>您主动提供的信息</h3>
                <p>当您通过电话或邮箱联系我们时，可能会提供称呼、联系方式、专业方向、咨询内容及后续沟通记录。请只提供完成本次沟通所必需的信息，不要发送与事项无关的敏感个人信息。</p>
                <h3>网站运行产生的必要信息</h3>
                <p>为保障页面正常访问、排查故障和防范安全风险，网站运行与托管服务可能形成基本访问日志，例如访问时间、请求页面、设备与浏览器类型、网络地址及错误记录。</p>
                <h3>本地功能数据</h3>
                <p>网站可能使用必要的浏览器本地存储或会话数据维持页面功能和演示状态。当前公开网站不使用广告追踪，也不基于您的浏览行为建立营销画像。</p>
              </section>

              <section>
                <h2>三、信息的使用目的</h2>
                <ul>
                  <li>回应您的咨询、加入意向或合作沟通；</li>
                  <li>核实沟通事项并安排必要的后续联系；</li>
                  <li>维护网站稳定与安全，诊断和修复故障；</li>
                  <li>履行适用法律法规要求的义务。</li>
                </ul>
                <p>如需将信息用于与上述目的无直接关系的用途，我们会另行说明，并在需要时取得您的同意。</p>
              </section>

              <section>
                <h2>四、共享、委托处理与转移</h2>
                <p>我们不会出售您的个人信息。除取得您的单独同意、为完成您请求的事项而进行必要的委托处理，或法律法规另有要求外，我们不会向无关第三方提供您的个人信息。</p>
                <p>如委托服务提供方处理必要信息，我们会限定处理目的和范围，并要求其采取相应的安全保护措施。</p>
              </section>

              <section>
                <h2>五、保存与安全</h2>
                <p>我们仅在实现处理目的所需的最短期限内保存信息，法律法规另有规定的除外。我们会采取与信息性质和风险相适应的管理与技术措施，减少未经授权访问、泄露、篡改或丢失的风险。</p>
                <p>互联网传输无法保证绝对安全。如发生可能影响您权益的安全事件，我们会依法采取处置措施并进行必要告知。</p>
              </section>

              <section>
                <h2>六、您的权利</h2>
                <p>在适用法律规定的范围内，您可以请求查询、复制、更正、补充或删除您的个人信息，也可以撤回已经作出的同意。我们会在核实身份后，于合理期限内处理您的请求。</p>
              </section>

              <section>
                <h2>七、未成年人信息</h2>
                <p>本网站主要面向具有工程、技术和项目经验的成年用户，不以未成年人为服务对象。未成年人不应在未取得监护人同意的情况下向我们提供个人信息。</p>
              </section>

              <section>
                <h2>八、政策更新与联系我们</h2>
                <p>我们可能根据网站功能、服务范围或法律要求更新本政策。重要变化会通过页面提示等适当方式说明，并在本页更新日期。</p>
                <p>如对本政策或个人信息处理有疑问、意见或权利请求，请联系海澜栖椿文化创意有限公司：</p>
                <address>
                  <span>联系人：马经理</span>
                  <a href="tel:+8613774495622">电话：+86 137 7449 5622</a>
                  <a href="mailto:mayonggang2021@gmail.com">邮箱：mayonggang2021@gmail.com</a>
                </address>
                <p><Link href="/">返回匠应达首页</Link></p>
              </section>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
