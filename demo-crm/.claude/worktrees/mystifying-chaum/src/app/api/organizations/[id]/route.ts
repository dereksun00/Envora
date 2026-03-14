import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      contacts: true,
      deals: { include: { contact: true, owner: true } },
      users: true,
    },
  });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(org);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const org = await prisma.organization.update({ where: { id }, data: body });
  return NextResponse.json(org);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.organization.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
