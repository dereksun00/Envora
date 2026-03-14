import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: {
      organization: true,
      contact: true,
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const deal = await prisma.deal.create({
    data: {
      name: body.name,
      amount: body.amount,
      stage: body.stage,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      organizationId: body.organizationId,
      contactId: body.contactId,
      ownerId: body.ownerId,
    },
  });
  return NextResponse.json(deal, { status: 201 });
}
