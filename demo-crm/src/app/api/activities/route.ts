import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const activities = await prisma.activity.findMany({
    include: {
      user: true,
      contact: true,
      deal: true,
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const activity = await prisma.activity.create({
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
  return NextResponse.json(activity, { status: 201 });
}
