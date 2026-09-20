"use client";

import { quietChipIdle, quietChipSelected } from "@/lib/quiet-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Spin" },
  { href: "/saved", label: "Saved" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink"
        >
          Eat What
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? quietChipSelected : quietChipIdle}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
