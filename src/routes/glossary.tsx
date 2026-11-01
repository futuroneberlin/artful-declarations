import { createFileRoute, redirect } from "@tanstack/react-router";

// Old QR codes/links pointed to /glossary; keep them working.
export const Route = createFileRoute("/glossary")({
  beforeLoad: () => { throw redirect({ to: "/exhibition", statusCode: 301 }); },
});
