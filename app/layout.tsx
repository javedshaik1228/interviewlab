import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://archroom-design-interview.shaikjaved1228.chatgpt.site"),
  title: {
    default: "InterviewRoom — System design and coding practice",
    template: "%s · InterviewRoom",
  },
  description:
    "Practice discussion-led system design interviews and NeetCode 150 coding rounds with adaptive feedback.",
  openGraph: {
    title: "InterviewRoom",
    description: "System design + coding interviews",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "InterviewRoom system design and coding interview practice" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewRoom",
    description: "System design + coding interviews",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
