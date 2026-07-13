import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

function safeSiteUrl(configuredUrl: string | undefined, requestHeaders: Headers) {
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      if (url.protocol === "http:" || url.protocol === "https:") return url;
    } catch {
      // Fall through to proxy-aware request headers.
    }
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "https" ? "https" : "http";
  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const metadataBase = safeSiteUrl(process.env.SITE_URL, requestHeaders);
  return {
    metadataBase,
    title: {
      default: "InterviewLab — System design and coding practice",
      template: "%s · InterviewLab",
    },
    description:
      "Practice discussion-led system design interviews and NeetCode 150 coding rounds with adaptive feedback.",
    openGraph: {
      title: "InterviewLab",
      description: "System design + coding interviews",
      images: [{ url: "/og-interviewlab.png", width: 1731, height: 909, alt: "InterviewLab system design and coding interview practice" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "InterviewLab",
      description: "System design + coding interviews",
      images: ["/og-interviewlab.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
