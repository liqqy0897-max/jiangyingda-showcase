import { notFound, redirect } from "next/navigation";
import { readPlatformActor } from "@/src/platform/auth";
import { resolvePlatformRoute } from "@/src/platform/routes";
import { PlatformShell } from "../../ui/PlatformShell";

export default async function PlatformRoutePage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const actor = await readPlatformActor();
  if (!actor) redirect("/platform/login");
  const { segments = [] } = await params;
  const route = resolvePlatformRoute(segments);
  if (!route) notFound();
  return <PlatformShell actor={actor} route={route} allowed={route.roles.includes(actor.role)} />;
}
