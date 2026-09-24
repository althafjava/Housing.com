import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CreateListingForm from "@/components/CreateListingForm";

export default async function SellPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [cities, localities] = await Promise.all([
    prisma.city.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.locality.findMany({ select: { id: true, name: true, cityId: true }, orderBy: { name: "asc" } }),
  ]);

  return <CreateListingForm cities={cities} localities={localities} />;
}
