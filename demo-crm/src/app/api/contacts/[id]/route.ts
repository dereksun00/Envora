import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      organization: true,
      deals: { include: { owner: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { user: true }, orderBy: { date: "desc" } },
    },
  });
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(contact);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const contact = await prisma.contact.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || null,
      title: body.title || null,
      organizationId: body.organizationId,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
