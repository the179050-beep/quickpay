Deno.serve(async (req) => {
  try {
    const { password } = await req.json();
    // Try both with and without VITE_ prefix
    const correct = Deno.env.get("DASHBOARD_PASSWORD") || Deno.env.get("VITE_DASHBOARD_PASSWORD");
    if (!correct) {
      return Response.json({ ok: false, error: "Password not configured" }, { status: 500 });
    }
    return Response.json({ ok: password === correct });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});