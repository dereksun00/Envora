import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import DealForm from "@/components/DealForm";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) notFound();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Edit Deal</h2>
      </div>
      <div className="page-container">
        <DealForm deal={{
          ...deal,
          amount: deal.amount.toString(),
          closeDate: deal.closeDate?.toISOString() || null,
        }} />
      </div>
    </>
  );
}
