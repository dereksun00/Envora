import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      organization: true,
      contact: true,
      owner: true,
      activities: {
        include: { user: true, contact: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(deal);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const deal = await prisma.deal.update({
    where: { id },
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
  return NextResponse.json(deal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
