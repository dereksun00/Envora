import { prisma } from "@/lib/db";
import { formatSize } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: { _count: { select: { deals: true, contacts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Organizations</h2>
        <Link href="/organizations/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z" />
          </svg>
          New Organization
        </Link>
      </div>
      <div className="page-container">
        <div className="data-table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Size</th>
                <th>Website</th>
                <th>Deals</th>
                <th>Contacts</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link href={`/organizations/${org.id}`} className="text-primary font-medium hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td>{org.industry}</td>
                  <td>
                    <span className={`badge badge-${org.size}`}>
                      {formatSize(org.size)}
                    </span>
                  </td>
                  <td>
                    {org.website ? (
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                        {org.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-default-400">—</span>
                    )}
                  </td>
                  <td className="font-medium">{org._count.deals}</td>
                  <td className="font-medium">{org._count.contacts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
