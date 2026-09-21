"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  ["首页", "/"],
  ["服务方式", "/services"],
  ["项目保障", "/assurance"],
  ["关于我们", "/about"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="匠应达首页">
        <Image
          className="brand-logo"
          src="/brand/jiangyingda-logo-cutout.png"
          alt="匠应达 工程专家经验服务平台"
          width={1667}
          height={466}
          priority
        />
      </Link>

      <nav className="desktop-nav" aria-label="主导航">
        {navItems.map(([label, href]) => (
          <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
        <Link className="nav-action" href="/join" aria-current={pathname === "/join" ? "page" : undefined}>
          申请加入
        </Link>
      </nav>

      <button
        className="menu-button"
        type="button"
        aria-label={menuOpen ? "关闭导航" : "打开导航"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {menuOpen && (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="移动端导航">
          {navItems.map(([label, href]) => (
            <Link
              href={href}
              key={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            className="nav-action"
            href="/join"
            aria-current={pathname === "/join" ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            申请加入
          </Link>
        </nav>
      )}
    </header>
  );
}
