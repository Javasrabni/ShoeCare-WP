import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar/navbar";
import { ToastProvider } from "./context/toast/toastContext";
import { SpinnerProvider } from "./context/spinner/spinnerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: 'normal', 
  variable: '--font-poppins', 
});



export const metadata: Metadata = {
  title: "ShoeCare",
  description: "Solusi Perawatan Sepatu Terbaik Anda: Layanan Pembersihan, Perbaikan, dan Pemeliharaan Ahli untuk Semua Kebutuhan Alas Kaki Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} antialiased`}
      >
        <ToastProvider>
          <SpinnerProvider>
            <Navbar />
            {children}
          </SpinnerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
