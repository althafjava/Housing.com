import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/rate-limit";

const leadSchema = z.object({
  listingId: z.string().min(1),
  channel: z.literal("contact_now"),
  contactInfo: z.string().optional(),
});

/** Direct synchronous write — no outbox, no queue, no CRM webhook fan-out
 * (excluded per project scope). A Lead row landing in Postgres *is* the
 * deliverable for this endpoint. */
export async function POST(request: NextRequest) {
  const key = rateLimitKeyFromRequest(request, "leads");
  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many requests, try again shortly" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { listingId, channel, contactInfo } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const session = await getSession();

  const lead = await prisma.lead.create({
    data: {
      listingId,
      channel,
      contactInfo,
      userId: session?.userId,
    },
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
