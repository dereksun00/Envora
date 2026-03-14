import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [orgCount, contactCount, dealCount, deals] = await Promise.all([
    prisma.organization.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.deal.findMany({ select: { stage: true, amount: true } }),
  ]);

  const pipelineValue = deals.reduce((sum, d) => sum + d.amount, 0);

  const stageBreakdown: Record<string, { count: number; total: number }> = {};
  for (const d of deals) {
    if (!stageBreakdown[d.stage]) stageBreakdown[d.stage] = { count: 0, total: 0 };
    stageBreakdown[d.stage].count++;
    stageBreakdown[d.stage].total += d.amount;
  }

  return NextResponse.json({
    orgCount,
    contactCount,
    dealCount,
    pipelineValue,
    stageBreakdown,
  });
}
