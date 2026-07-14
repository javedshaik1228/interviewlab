import { handleInterviewerOptions, handleInterviewerPost } from "../../lib/interviewer-service";

const options = { allowedOrigins: process.env.ALLOWED_ORIGINS };

export function OPTIONS(request: Request) {
  return handleInterviewerOptions(request, options);
}

export function POST(request: Request) {
  return handleInterviewerPost(request, options);
}
