import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const contacts = await prisma.contact.findMany({
    where: orgId ? { organizationId: orgId } : undefined,
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.create({ data: body });
  return NextResponse.json(contact, { status: 201 });
}
