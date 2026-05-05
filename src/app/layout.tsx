import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "צליל שווה",
  description: "סטודיו למוזיקה ותרפיה — ניהול תלמידים וכרטיסיות",
  manifest: "/manifest.json",
  applicationName: "צליל שווה",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "צליל שווה",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#C76A82",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans bg-cream min-h-dvh antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
