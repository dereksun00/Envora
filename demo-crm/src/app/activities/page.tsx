import { prisma } from "@/lib/db";
import { formatDate, formatActivityType } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({
    include: { user: true, contact: true, deal: true },
    orderBy: { date: "desc" },
  });

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Activities</h2>
        <Link href="/activities/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z" />
          </svg>
          New Activity
        </Link>
      </div>
      <div className="page-container">
        <div className="data-table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Subject</th>
                <th>Contact</th>
                <th>Deal</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} style={{ cursor: "default" }}>
                  <td>
                    <span className={`badge badge-${activity.type}`}>
                      {formatActivityType(activity.type)}
                    </span>
                  </td>
                  <td className="font-medium">{activity.subject}</td>
                  <td>
                    {activity.contact ? (
                      <Link href={`/contacts/${activity.contact.id}`} className="text-secondary hover:underline">
                        {activity.contact.firstName} {activity.contact.lastName}
                      </Link>
                    ) : (
                      <span className="text-default-400">—</span>
                    )}
                  </td>
                  <td>
                    {activity.deal ? (
                      <Link href={`/deals/${activity.deal.id}`} className="text-secondary hover:underline">
                        {activity.deal.name}
                      </Link>
                    ) : (
                      <span className="text-default-400">—</span>
                    )}
                  </td>
                  <td>{activity.user.name}</td>
                  <td>{formatDate(activity.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
