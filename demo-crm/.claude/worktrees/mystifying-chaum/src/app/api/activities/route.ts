import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activities = await prisma.activity.findMany({
    include: {
      contact: { select: { firstName: true, lastName: true } },
      deal: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.date) body.date = new Date(body.date);
  if (body.dealId === "") delete body.dealId;
  if (body.contactId === "") delete body.contactId;
  const activity = await prisma.activity.create({ data: body });
  return NextResponse.json(activity, { status: 201 });
}
