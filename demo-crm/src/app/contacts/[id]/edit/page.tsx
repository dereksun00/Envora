import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Edit Contact</h2>
      </div>
      <div className="page-container">
        <ContactForm contact={contact} />
      </div>
    </>
  );
}
