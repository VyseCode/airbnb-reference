import { fail, handleError, ok } from "@/lib/api";
import { runStayCompletion } from "@/lib/stayCompletion";

function authorization(request: Request): "ok" | "denied" | "unconfigured" {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "unconfigured";
  return request.headers.get("authorization") === `Bearer ${secret}`
    ? "ok"
    : "denied";
}

async function run(request: Request) {
  const auth = authorization(request);
  if (auth === "unconfigured") {
    return fail("CRON_SECRET is not configured", 503);
  }
  if (auth === "denied") return fail("Unauthorized", 401);
  try {
    const report = await runStayCompletion();
    return ok({ ranAt: new Date().toISOString(), ...report });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
