import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: {
      organization: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.amount) body.amount = parseFloat(body.amount);
  if (body.closeDate) body.closeDate = new Date(body.closeDate);
  const deal = await prisma.deal.create({ data: body });
  return NextResponse.json(deal, { status: 201 });
}
