import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateEmi } from "@/lib/emi";

const emiSchema = z.object({
  principal: z.number().positive(),
  annualRatePercent: z.number().min(0),
  tenureYears: z.number().positive(),
});

/** Pure calculation, no external dependency — always available even if a
 * home-loan partner integration (out of scope for this plan) is down. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = emiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = calculateEmi(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
