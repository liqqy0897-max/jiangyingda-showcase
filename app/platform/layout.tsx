import { notFound } from "next/navigation";
import { isPlatformDemoEnabled } from "@/src/platform/access";
import "./platform.css";

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isPlatformDemoEnabled()) notFound();
  return children;
}
