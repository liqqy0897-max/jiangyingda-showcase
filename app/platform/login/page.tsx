import type { Metadata } from "next";
import { PlatformLogin } from "../ui/PlatformLogin";

export const metadata: Metadata = { title: "演示登录｜匠应达 MVP 平台" };

export default function PlatformLoginPage() {
  return <PlatformLogin />;
}
