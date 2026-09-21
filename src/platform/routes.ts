import type { PlatformRole } from "./domain.mjs";

export type PlatformScreen =
  | "workspace"
  | "enterprise-profile"
  | "expert-profile"
  | "expert-certification"
  | "demand-new"
  | "demand-detail"
  | "candidates"
  | "invitation"
  | "service-order"
  | "project"
  | "consultant-queue"
  | "consultant-matching"
  | "messages"
  | "admin-certifications"
  | "admin-exceptions"
  | "admin-rates"
  | "admin-audit";

export interface PlatformRoute {
  screen: PlatformScreen;
  title: string;
  roles: PlatformRole[];
  objectId?: string;
}

const all: PlatformRole[] = ["enterprise", "expert", "consultant", "admin"];

export function resolvePlatformRoute(segments: string[] = []): PlatformRoute | null {
  const path = segments.join("/");
  if (!path || path === "workspace") return { screen: "workspace", title: "角色工作台", roles: all };
  if (path === "enterprise/profile") return { screen: "enterprise-profile", title: "企业资料", roles: ["enterprise"] };
  if (path === "expert/profile") return { screen: "expert-profile", title: "专家资料", roles: ["expert"] };
  if (path === "expert/certification") return { screen: "expert-certification", title: "专家认证", roles: ["expert"] };
  if (path === "demands/new") return { screen: "demand-new", title: "创建企业需求", roles: ["enterprise", "consultant"] };
  if (segments[0] === "demands" && segments[1] && segments[2] === "candidates" && segments.length === 3) return { screen: "candidates", title: "候选专家与直接邀约", roles: ["enterprise", "consultant"], objectId: segments[1] };
  if (segments[0] === "demands" && segments[1] && segments.length === 2) return { screen: "demand-detail", title: "需求详情与核验记录", roles: ["enterprise", "consultant", "admin"], objectId: segments[1] };
  if (segments[0] === "invitations" && segments[1] && segments.length === 2) return { screen: "invitation", title: "邀约与报价协商", roles: ["enterprise", "expert", "consultant"], objectId: segments[1] };
  if (segments[0] === "service-orders" && segments[1] && segments.length === 2) return { screen: "service-order", title: "服务单版本与双确认", roles: ["enterprise", "expert", "consultant"], objectId: segments[1] };
  if (segments[0] === "projects" && segments[1] && segments.length === 2) return { screen: "project", title: "项目交付与验收", roles: ["enterprise", "expert", "consultant", "admin"], objectId: segments[1] };
  if (path === "consultant/queue") return { screen: "consultant-queue", title: "顾问需求队列", roles: ["consultant"] };
  if (path === "consultant/matching") return { screen: "consultant-matching", title: "匹配工作台", roles: ["consultant"] };
  if (path === "messages") return { screen: "messages", title: "消息中心", roles: all };
  if (path === "admin/certifications") return { screen: "admin-certifications", title: "专家认证审核", roles: ["admin"] };
  if (path === "admin/exceptions") return { screen: "admin-exceptions", title: "项目异常治理", roles: ["admin"] };
  if (path === "admin/rates") return { screen: "admin-rates", title: "费率版本", roles: ["admin"] };
  if (path === "admin/audit") return { screen: "admin-audit", title: "审计链", roles: ["admin"] };
  return null;
}

export const PLATFORM_NAV: Record<PlatformRole, Array<{ label: string; href: string }>> = {
  enterprise: [
    { label: "工作台", href: "/platform/workspace" }, { label: "创建需求", href: "/platform/demands/new" },
    { label: "企业资料", href: "/platform/enterprise/profile" }, { label: "消息", href: "/platform/messages" },
  ],
  expert: [
    { label: "工作台", href: "/platform/workspace" }, { label: "专家资料", href: "/platform/expert/profile" },
    { label: "资料认证", href: "/platform/expert/certification" }, { label: "消息", href: "/platform/messages" },
  ],
  consultant: [
    { label: "工作台", href: "/platform/workspace" }, { label: "需求队列", href: "/platform/consultant/queue" },
    { label: "匹配工作台", href: "/platform/consultant/matching" }, { label: "消息", href: "/platform/messages" },
  ],
  admin: [
    { label: "治理总览", href: "/platform/workspace" }, { label: "专家认证", href: "/platform/admin/certifications" },
    { label: "异常治理", href: "/platform/admin/exceptions" }, { label: "费率版本", href: "/platform/admin/rates" },
    { label: "审计链", href: "/platform/admin/audit" }, { label: "消息", href: "/platform/messages" },
  ],
};
