import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { deals: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orgs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const org = await prisma.organization.create({ data: body });
  return NextResponse.json(org, { status: 201 });
}
