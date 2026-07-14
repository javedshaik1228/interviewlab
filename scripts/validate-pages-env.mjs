const value = process.env.NEXT_PUBLIC_INTERVIEWER_API_URL?.trim();

if (!value) {
  throw new Error("Set the INTERVIEWER_API_URL repository variable before deploying GitHub Pages.");
}

const url = new URL(value);
if (url.protocol !== "https:" || url.username || url.password || url.origin !== value.replace(/\/$/, "")) {
  throw new Error("INTERVIEWER_API_URL must be an HTTPS origin without credentials, a path, query, or fragment.");
}

console.log(`Using interviewer proxy at ${url.origin}`);
