import type { Metadata } from "next";
import { IBM_Plex_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "AI Agent Mission Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${ibmPlexMono.variable} antialiased`}>
        <ConvexClientProvider>
          {children}
          <Toaster
            richColors
            closeButton
            position="bottom-right"
            duration={2200}
            toastOptions={{
              classNames: {
                toast: "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
                description: "text-[var(--text-secondary)]",
              },
            }}
          />
        </ConvexClientProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
