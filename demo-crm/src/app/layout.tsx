import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Acme CRM",
  description: "A modern CRM for managing your sales pipeline, organizations, contacts, and deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="ml-[260px] flex-1 min-h-screen">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
