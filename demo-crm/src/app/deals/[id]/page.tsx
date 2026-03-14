import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, formatStage, formatActivityType } from "@/lib/format";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      organization: true,
      contact: true,
      owner: true,
      activities: {
        include: { user: true, contact: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!deal) notFound();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">{deal.name}</h2>
        <div className="detail-actions">
          <Link href={`/deals/${deal.id}/edit`} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.49 3.17c.38-.38.89-.57 1.41-.57.52 0 1.04.2 1.41.57.78.78.78 2.05 0 2.83L6.04 14.27l-3 .75a.5.5 0 01-.61-.61l.75-3L11.49 3.17z" />
            </svg>
            Edit
          </Link>
          <DeleteButton
            entityName={deal.name}
            entityType="Deal"
            deleteUrl={`/api/deals/${deal.id}`}
            redirectUrl="/deals"
          />
        </div>
      </div>
      <div className="page-container">
        <div className="info-card animate-in">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "2rem", marginBottom: "1.5rem" }}>
            <div>
              <div className="info-item-label">Amount</div>
              <div className="big-number">{formatCurrency(Number(deal.amount))}</div>
            </div>
            <div style={{ paddingTop: "1.2rem" }}>
              <span className={`badge badge-${deal.stage}`} style={{ fontSize: "0.875rem", padding: "0.375rem 1rem" }}>
                {formatStage(deal.stage)}
              </span>
            </div>
          </div>
          <div className="info-grid">
            <div>
              <div className="info-item-label">Organization</div>
              <div className="info-item-value">
                <Link href={`/organizations/${deal.organizationId}`}>{deal.organization.name}</Link>
              </div>
            </div>
            <div>
              <div className="info-item-label">Contact</div>
              <div className="info-item-value">
                <Link href={`/contacts/${deal.contactId}`}>{deal.contact.firstName} {deal.contact.lastName}</Link>
              </div>
            </div>
            <div>
              <div className="info-item-label">Owner</div>
              <div className="info-item-value">{deal.owner.name}</div>
            </div>
            <div>
              <div className="info-item-label">Close Date</div>
              <div className="info-item-value">
                {deal.closeDate ? formatDate(deal.closeDate) : "—"}
              </div>
            </div>
          </div>
        </div>

        <h3 className="section-title">Activity Timeline ({deal.activities.length})</h3>
        {deal.activities.length > 0 ? (
          <div className="timeline animate-in" style={{ animationDelay: "150ms" }}>
            {deal.activities.map((activity) => (
              <div key={activity.id} className="timeline-item">
                <div className={`timeline-dot ${activity.type}`} />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`badge badge-${activity.type}`}>
                        {formatActivityType(activity.type)}
                      </span>
                      <span className="timeline-subject">{activity.subject}</span>
                    </div>
                    <span className="timeline-date">{formatDate(activity.date)}</span>
                  </div>
                  {activity.description && (
                    <div className="timeline-body">{activity.description}</div>
                  )}
                  <div className="timeline-meta">
                    <span>by {activity.user.name}</span>
                    {activity.contact && (
                      <span>• {activity.contact.firstName} {activity.contact.lastName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-text">No activities recorded for this deal yet.</div>
          </div>
        )}
      </div>
    </>
  );
}
