import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber, formatStage } from "@/lib/format";
import { DealStage } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const [orgCount, contactCount, dealCount, deals] = await Promise.all([
    prisma.organization.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.deal.findMany({ select: { amount: true, stage: true } }),
  ]);

  const pipelineValue = deals.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  const stageBreakdown = Object.values(DealStage).map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + Number(d.amount), 0),
    };
  });

  return { orgCount, contactCount, dealCount, pipelineValue, stageBreakdown };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Dashboard</h2>
      </div>
      <div className="page-container">
        <div className="stats-grid animate-stagger">
          {[
            { label: "Organizations", value: formatNumber(stats.orgCount) },
            { label: "Contacts", value: formatNumber(stats.contactCount) },
            { label: "Total Deals", value: formatNumber(stats.dealCount) },
            { label: "Pipeline Value", value: formatNumber(Math.round(stats.pipelineValue)), isCurrency: true },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-content1 border border-content3 p-5">
              <div className="stat-card-label">{stat.label}</div>
              <div className={`stat-card-value${stat.isCurrency ? " currency" : ""}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <h3 className="section-title">Deal Stage Breakdown</h3>
        <div className="data-table-wrapper animate-in" style={{ animationDelay: "200ms" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Count</th>
                <th style={{ textAlign: "right" }}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {stats.stageBreakdown.map((row) => (
                <tr key={row.stage} style={{ cursor: "default" }}>
                  <td>
                    <span className={`badge badge-${row.stage}`}>
                      {formatStage(row.stage)}
                    </span>
                  </td>
                  <td className="font-medium">{row.count}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(row.value)}
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
