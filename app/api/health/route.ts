export function GET() {
  return Response.json(
    { status: "ok", service: "interviewlab" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
