import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatStage } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const deals = await prisma.deal.findMany({
    include: { organization: true, contact: true, owner: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Deals</h2>
        <Link href="/deals/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z" />
          </svg>
          New Deal
        </Link>
      </div>
      <div className="page-container">
        <div className="data-table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Organization</th>
                <th>Contact</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Stage</th>
                <th>Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <Link href={`/deals/${deal.id}`} className="text-primary font-medium hover:underline">
                      {deal.name}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/organizations/${deal.organizationId}`} className="text-secondary hover:underline">
                      {deal.organization.name}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/contacts/${deal.contactId}`} className="text-secondary hover:underline">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </Link>
                  </td>
                  <td className="text-right font-mono">
                    {formatCurrency(Number(deal.amount))}
                  </td>
                  <td>
                    <span className={`badge badge-${deal.stage}`}>
                      {formatStage(deal.stage)}
                    </span>
                  </td>
                  <td>
                    {deal.closeDate ? formatDate(deal.closeDate) : <span className="text-default-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
