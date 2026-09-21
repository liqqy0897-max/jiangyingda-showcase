import Link from "next/link";
import Image from "next/image";

const navItems = [
  ["首页", "/"],
  ["服务方式", "/services"],
  ["项目保障", "/assurance"],
  ["关于我们", "/about"],
  ["隐私政策", "/privacy"],
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand footer-brand" href="/" aria-label="匠应达首页">
            <Image
              className="brand-logo"
              src="/brand/jiangyingda-logo-cutout.png"
              alt="匠应达 工程专家经验服务平台"
              width={1667}
              height={466}
              loading="eager"
            />
          </Link>
          <p>让专业经验继续产生价值。</p>
          <p className="footer-entity">运营主体：海澜栖椿文化创意有限公司</p>
        </div>
        <address className="footer-contact">
          <strong>联系方式：</strong>
          <span>马经理</span>
          <a href="tel:+8613774495622">+86 137 7449 5622</a>
          <a href="mailto:mayonggang2021@gmail.com">mayonggang2021@gmail.com</a>
        </address>
        <nav aria-label="页脚导航">
          {navItems.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>
      </div>
      <p className="footer-note">当前为纯展示官网；申请表仅演示交互，不会发送或保存信息。</p>
    </footer>
  );
}
