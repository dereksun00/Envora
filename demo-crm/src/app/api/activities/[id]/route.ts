import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { user: true, contact: true, deal: true },
  });
  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(activity);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const activity = await prisma.activity.update({
    where: { id },
    data: {
      type: body.type,
      subject: body.subject,
      description: body.description || null,
      date: new Date(body.date),
      dealId: body.dealId || null,
      contactId: body.contactId || null,
      userId: body.userId,
    },
  });
  return NextResponse.json(activity);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
