import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { RouteExperience } from "./components/RouteExperience";
import "./globals.css";

const bodyFont = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "匠应达｜工程专家经验服务平台",
  description: "连接经验丰富的工程技术人才与真实产业需求，让专业经验以灵活、清晰、有边界的方式继续产生价值。",
  icons: { icon: "/brand/jiangyingda-mark.jpg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const tunnelViewportRecoveryScript = `
(() => {
  const recoveryKey = 'jiangyingda-tunnel-mobile-viewport';
  const recoverViewport = () => {
    const isTunnel = window.location.hostname.endsWith('.devtunnels.ms');
    const isMobileScreen = window.screen.width < 1024;
    const inheritedWideViewport = window.innerWidth > window.screen.width * 1.25;

    if (!isTunnel || !isMobileScreen) return;

    try {
      if (inheritedWideViewport && !window.sessionStorage.getItem(recoveryKey)) {
        window.sessionStorage.setItem(recoveryKey, '1');
        window.location.reload();
        return;
      }

      if (!inheritedWideViewport) {
        window.sessionStorage.removeItem(recoveryKey);
      }
    } catch {
      // The standard responsive viewport remains the fallback when storage is unavailable.
    }
  };

  window.setTimeout(recoverViewport, 800);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', recoverViewport, { once: true });
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: tunnelViewportRecoveryScript }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <RouteExperience />
        {children}
      </body>
    </html>
  );
}
