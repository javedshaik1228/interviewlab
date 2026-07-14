import {
  handleInterviewerOptions,
  handleInterviewerPost,
} from "../app/lib/interviewer-service";

type Env = {
  ALLOWED_ORIGINS?: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const worker = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const options = { allowedOrigins: env.ALLOWED_ORIGINS };

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ status: "ok", service: "interviewlab-provider-proxy" });
    }
    if (url.pathname === "/api/interviewer" && request.method === "OPTIONS") {
      return handleInterviewerOptions(request, options);
    }
    if (url.pathname === "/api/interviewer" && request.method === "POST") {
      return handleInterviewerPost(request, options);
    }

    return json({ error: "Not found." }, 404);
  },
};

export default worker;
