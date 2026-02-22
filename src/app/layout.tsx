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
    <html lang="en" className="light">
      <body
        className={`${dmSans.variable} ${ibmPlexMono.variable} bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased`}
      >
        <ConvexClientProvider>
          {children}
          <Toaster
            richColors
            closeButton
            position="bottom-right"
            duration={2400}
            toastOptions={{
              classNames: {
                toast:
                  "border border-gray-100 bg-white text-gray-900 shadow-lg",
                description: "text-gray-500",
              },
            }}
          />
        </ConvexClientProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
