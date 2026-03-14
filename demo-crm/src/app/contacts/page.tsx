import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="top-header">
        <h2 className="page-title">Contacts</h2>
        <Link href="/contacts/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 010-2h4V3a1 1 0 011-1z" />
          </svg>
          New Contact
        </Link>
      </div>
      <div className="page-container">
        <div className="data-table-wrapper animate-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Title</th>
                <th>Organization</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <Link href={`/contacts/${contact.id}`} className="text-primary font-medium hover:underline">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td>{contact.email}</td>
                  <td>{contact.title || <span className="text-default-400">—</span>}</td>
                  <td>
                    <Link href={`/organizations/${contact.organizationId}`} className="text-secondary hover:underline">
                      {contact.organization.name}
                    </Link>
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
