import Link from "next/link";
import { BookOpenCheck, Clock3, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "@/components/logout-button";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => undefined);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-stone-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href={user ? "/tableau-de-bord" : "/connexion"} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sauge text-white shadow-sm">
              <BookOpenCheck size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-bold text-encre">Fiche pédagogique</span>
              <span className="block text-sm text-brun">Canevas connecté au GPT</span>
            </span>
          </Link>

          {user ? (
            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/tableau-de-bord" className="bouton-navigation">
                <LayoutDashboard size={16} aria-hidden="true" />
                Tableau de bord
              </Link>
              <Link href="/historique" className="bouton-navigation">
                <Clock3 size={16} aria-hidden="true" />
                Historique
              </Link>
              <Link href="/parametres" className="bouton-navigation">
                <Settings size={16} aria-hidden="true" />
                Paramètres
              </Link>
              {user.role === "admin" ? (
                <Link href="/admin" className="bouton-navigation">
                  <ShieldCheck size={16} aria-hidden="true" />
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </nav>
          ) : null}
        </div>
      </header>

      <main className="page-impression mx-auto min-h-[calc(100vh-170px)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="no-print border-t border-stone-100 bg-white/90 px-4 py-5 text-center text-sm font-medium text-brun">
        Créé par Ehuzu Learning Lab
      </footer>
    </div>
  );
}