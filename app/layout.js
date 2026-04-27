import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "ScanMBG — Cek Gizi Makanan Bergizi Gratis",
  description:
    "Scan baki MBG untuk mengungkap fakta gizi sebenarnya. Bandingkan dengan standar Kemenkes. Transparansi gizi untuk 82 juta anak Indonesia.",
  keywords: ["MBG", "Makan Bergizi Gratis", "gizi", "nutrisi", "scan makanan", "Kemenkes", "SPPG"],
  openGraph: {
    title: "ScanMBG — Cek Gizi Makanan Bergizi Gratis",
    description: "Scan baki MBG untuk mengungkap fakta gizi sebenarnya.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F7F7F5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={plusJakartaSans.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans antialiased bg-bg">{children}</body>
    </html>
  );
}
