import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      organization: true,
      deals: { include: { owner: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { user: true }, orderBy: { date: "desc" } },
    },
  });

  if (!contact) notFound();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">{contact.firstName} {contact.lastName}</h2>
        <div className="detail-actions">
          <Link href={`/contacts/${contact.id}/edit`} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.49 3.17c.38-.38.89-.57 1.41-.57.52 0 1.04.2 1.41.57.78.78.78 2.05 0 2.83L6.04 14.27l-3 .75a.5.5 0 01-.61-.61l.75-3L11.49 3.17z" />
            </svg>
            Edit
          </Link>
          <DeleteButton
            entityName={`${contact.firstName} ${contact.lastName}`}
            entityType="Contact"
            deleteUrl={`/api/contacts/${contact.id}`}
            redirectUrl="/contacts"
          />
        </div>
      </div>
      <div className="page-container">
        <div className="info-card animate-in">
          <div className="info-grid">
            <div>
              <div className="info-item-label">Email</div>
              <div className="info-item-value">{contact.email}</div>
            </div>
            <div>
              <div className="info-item-label">Phone</div>
              <div className="info-item-value">{contact.phone || "—"}</div>
            </div>
            <div>
              <div className="info-item-label">Title</div>
              <div className="info-item-value">{contact.title || "—"}</div>
            </div>
            <div>
              <div className="info-item-label">Organization</div>
              <div className="info-item-value">
                <Link href={`/organizations/${contact.organizationId}`}>{contact.organization.name}</Link>
              </div>
            </div>
            <div>
              <div className="info-item-label">Created</div>
              <div className="info-item-value">{formatDate(contact.createdAt)}</div>
            </div>
          </div>
        </div>

        {contact.deals.length > 0 && (
          <>
            <h3 className="section-title">Deals ({contact.deals.length})</h3>
            <div className="data-table-wrapper" style={{ marginBottom: "1.5rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Stage</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {contact.deals.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <Link href={`/deals/${deal.id}`} className="text-primary font-medium hover:underline">{deal.name}</Link>
                      </td>
                      <td className="text-right font-mono">
                        ${Number(deal.amount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge badge-${deal.stage}`}>{deal.stage.replace(/_/g, " ")}</span>
                      </td>
                      <td>{deal.owner.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
