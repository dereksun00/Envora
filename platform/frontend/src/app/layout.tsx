import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "../components/sidebar"
import { ThemeProvider } from "../components/theme-provider"

export const metadata: Metadata = {
  title: "Envora — Sandbox Platform",
  description: "Provision isolated demo environments with AI-generated data",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bp5-dark" suppressHydrationWarning>
        <ThemeProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="app-main">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
