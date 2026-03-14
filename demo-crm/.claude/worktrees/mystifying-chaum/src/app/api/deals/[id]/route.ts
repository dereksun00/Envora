import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      organization: true,
      contact: true,
      owner: true,
      activities: { include: { user: true }, orderBy: { date: "desc" } },
    },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.amount) body.amount = parseFloat(body.amount);
  if (body.closeDate) body.closeDate = new Date(body.closeDate);
  const deal = await prisma.deal.update({ where: { id }, data: body });
  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
