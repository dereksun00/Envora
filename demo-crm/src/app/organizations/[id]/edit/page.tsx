import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import OrganizationForm from "@/components/OrganizationForm";

export const dynamic = "force-dynamic";

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) notFound();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Edit Organization</h2>
      </div>
      <div className="page-container">
        <OrganizationForm org={org} />
      </div>
    </>
  );
}
