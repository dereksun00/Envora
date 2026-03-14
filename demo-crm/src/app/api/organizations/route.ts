import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const organizations = await prisma.organization.findMany({
    include: { _count: { select: { deals: true, contacts: true, users: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(organizations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const organization = await prisma.organization.create({
    data: {
      name: body.name,
      industry: body.industry,
      size: body.size,
      website: body.website || null,
    },
  });
  return NextResponse.json(organization, { status: 201 });
}
