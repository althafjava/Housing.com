import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import NotifyWidget from "@/components/NotifyWidget";

export const metadata: Metadata = {
  title: "IndiaProperty — Residential Property Search",
  description: "Find apartments, villas and independent houses for sale and rent.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const [user, favoritesCount, cities] = await Promise.all([
    session
      ? prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
      : null,
    session ? prisma.favorite.count({ where: { userId: session.userId } }) : 0,
    prisma.city.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <html lang="en">
      <body>
        <Header user={user} />
        <Suspense fallback={<div className="searchbar" style={{ height: "var(--searchbar-h)" }} />}>
          <SearchBar cities={cities} favoritesCount={favoritesCount} />
        </Suspense>
        {children}
        <NotifyWidget />
      </body>
    </html>
  );
}
