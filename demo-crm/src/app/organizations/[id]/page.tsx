import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatSize, formatDate } from "@/lib/format";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import OrgDetailClient from "@/components/OrgDetailClient";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      deals: {
        include: { contact: true, owner: true },
        orderBy: { createdAt: "desc" },
      },
      users: { orderBy: { name: "asc" } },
    },
  });

  if (!org) notFound();

  const orgData = JSON.parse(JSON.stringify(org));

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">{org.name}</h2>
        <div className="detail-actions">
          <Link href={`/organizations/${org.id}/edit`} className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.49 3.17c.38-.38.89-.57 1.41-.57.52 0 1.04.2 1.41.57.78.78.78 2.05 0 2.83L6.04 14.27l-3 .75a.5.5 0 01-.61-.61l.75-3L11.49 3.17z" />
            </svg>
            Edit
          </Link>
          <DeleteButton
            entityName={org.name}
            entityType="Organization"
            deleteUrl={`/api/organizations/${org.id}`}
            redirectUrl="/organizations"
          />
        </div>
      </div>
      <div className="page-container">
        <div className="info-card animate-in">
          <div className="info-grid">
            <div>
              <div className="info-item-label">Industry</div>
              <div className="info-item-value">{org.industry}</div>
            </div>
            <div>
              <div className="info-item-label">Size</div>
              <div className="info-item-value">
                <span className={`badge badge-${org.size}`}>{formatSize(org.size)}</span>
              </div>
            </div>
            <div>
              <div className="info-item-label">Website</div>
              <div className="info-item-value">
                {org.website ? (
                  <a href={org.website} target="_blank" rel="noopener noreferrer">{org.website}</a>
                ) : "—"}
              </div>
            </div>
            <div>
              <div className="info-item-label">Created</div>
              <div className="info-item-value">{formatDate(org.createdAt)}</div>
            </div>
          </div>
        </div>

        <OrgDetailClient org={orgData} />
      </div>
    </>
  );
}
