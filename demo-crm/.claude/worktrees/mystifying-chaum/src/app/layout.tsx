import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acme CRM",
  description: "Customer Relationship Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Sidebar />
        <div className="ml-60">
          <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
            <span className="text-sm text-gray-500">Acme CRM</span>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
