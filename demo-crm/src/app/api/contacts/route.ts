import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contact = await prisma.contact.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || null,
      title: body.title || null,
      organizationId: body.organizationId,
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
