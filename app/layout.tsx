import "@fontsource-variable/manrope";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ReduxProvider } from "@/app/providers";

export const metadata: Metadata = {
  description: "Secure administration workspace for the TradeUply platform.",
  robots: { follow: false, index: false },
  title: {
    default: "TradeUply Admin",
    template: "%s | TradeUply Admin",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  initialScale: 1,
  themeColor: "#031a3b",
  width: "device-width",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
