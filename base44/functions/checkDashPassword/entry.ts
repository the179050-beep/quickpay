import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { password } = await req.json();
    const correct = Deno.env.get("VITE_DASHBOARD_PASSWORD");
    if (!correct) {
      return Response.json({ ok: false, error: "Password not configured" }, { status: 500 });
    }
    return Response.json({ ok: password === correct });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});