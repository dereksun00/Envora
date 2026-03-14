import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      deals: {
        include: { contact: true, owner: true },
        orderBy: { createdAt: "desc" },
      },
      users: { orderBy: { name: "asc" } },
      _count: { select: { deals: true, contacts: true, users: true } },
    },
  });
  if (!organization) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(organization);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const organization = await prisma.organization.update({
    where: { id },
    data: {
      name: body.name,
      industry: body.industry,
      size: body.size,
      website: body.website || null,
    },
  });
  return NextResponse.json(organization);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
