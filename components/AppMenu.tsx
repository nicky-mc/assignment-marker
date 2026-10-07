"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, LogOut, Menu } from "lucide-react";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MenuLink {
  href: string;
  label: string;
}

// The header menu button and its dropdown. Which items appear is decided on the server (HeaderMenu) from the
// user's role, then passed in: this component only renders them. Enter or Space opens it, arrow keys move,
// Esc closes it and returns focus to the button (handled by the menu primitive).
export default function AppMenu({
  email,
  role,
  links,
  canSignOut,
}: {
  email: string | null;
  role: string | null;
  links: MenuLink[];
  canSignOut: boolean;
}) {
  const pathname = usePathname();
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5 px-3")}
          aria-label="Menu"
        >
          <Menu aria-hidden="true" />
          Menu
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-64 max-w-[calc(100vw-2rem)] border-2 border-border p-2">
          {email && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col items-start gap-1 px-2 py-2 text-sm text-ink">
                  <span className="break-all font-medium">{email}</span>
                  {role && <Badge variant="outline">{role}</Badge>}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          {links.map((l) => {
            const current = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <DropdownMenuItem
                key={l.href}
                render={<Link href={l.href} />}
                aria-current={current ? "page" : undefined}
                className={cn("min-h-10 px-2 text-base", current && "bg-accent font-semibold")}
              >
                {l.label}
                {current && <Check className="ml-auto" aria-hidden="true" />}
                {current && <span className="sr-only"> (current page)</span>}
              </DropdownMenuItem>
            );
          })}
          {canSignOut && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10 px-2 text-base" onClick={() => signOutForm.current?.requestSubmit()}>
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {canSignOut && <form ref={signOutForm} action="/auth/signout" method="post" className="hidden" />}
    </>
  );
}
