import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Fogri",
  title: "Fogri — focus, one thing at a time",
  description: "A calm focus timer, task list, and weekly progress view.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
