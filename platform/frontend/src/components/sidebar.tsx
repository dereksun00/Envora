"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button, Icon } from "@blueprintjs/core"
import { useTheme } from "./theme-provider"

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" as const },
  { href: "/projects/new", label: "New Project", icon: "plus" as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <div className="app-sidebar">
      <div className="app-sidebar-brand">
        <Icon icon="cube" size={18} style={{ color: "#2d72d2" }} />
        <span>Envora</span>
      </div>
      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link${isActive ? " active" : ""}`}
            >
              <Icon icon={item.icon} size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="app-sidebar-footer">
        <Button
          minimal
          fill
          icon={theme === "dark" ? "flash" : "moon"}
          onClick={toggle}
          alignText="left"
          text={theme === "dark" ? "Light mode" : "Dark mode"}
        />
      </div>
    </div>
  )
}
