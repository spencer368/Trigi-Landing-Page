const UPSTREAM = process.env.WAITLIST_UPSTREAM ?? "https://trigi.ai/api/waitlist";

function text(value: unknown, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const email = text(record.email, 320);
  const name = text(record.name);
  const company = text(record.company);
  const role = text(record.role);
  const agents = Array.isArray(record.agents)
    ? record.agents.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8)
    : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const bodies = [
    JSON.stringify({ email, name, company, role, agents }),
    JSON.stringify({ email }),
  ];

  try {
    let upstream: Response | null = null;
    let data: { error?: unknown } = {};

    for (const body of bodies) {
      upstream = await fetch(UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      data = (await upstream.json().catch(() => ({}))) as { error?: unknown };
      if (upstream.ok || body === bodies[bodies.length - 1]) break;
    }

    if (!upstream || !upstream.ok) {
      const error = typeof data.error === "string" ? data.error : "Something went wrong. Try again.";
      const status = upstream && upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return Response.json({ error }, { status });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Network error. Try again." }, { status: 502 });
  }
}
