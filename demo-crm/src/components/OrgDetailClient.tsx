"use client";

import { Tabs, Tab, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import Link from "next/link";
import { formatCurrency, formatDate, formatStage, formatRole } from "@/lib/format";

interface OrgDetailClientProps {
  org: {
    id: string;
    name: string;
    industry: string;
    size: string;
    website: string | null;
    createdAt: string;
    contacts: { id: string; firstName: string; lastName: string; email: string; title: string | null }[];
    deals: {
      id: string;
      name: string;
      amount: string | number;
      stage: string;
      closeDate: string | null;
      contact: { firstName: string; lastName: string };
      owner: { name: string };
    }[];
    users: { id: string; name: string; email: string; role: string }[];
  };
}

export default function OrgDetailClient({ org }: OrgDetailClientProps) {
  return (
    <Tabs variant="underlined" classNames={{ tabList: "gap-6", tab: "px-0 h-12" }}>
      <Tab key="contacts" title={`Contacts (${org.contacts.length})`}>
        <Table aria-label="Contacts" removeWrapper classNames={{ th: "bg-content1", td: "py-3" }}>
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Title</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No contacts yet">
            {org.contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/contacts/${contact.id}`} className="text-primary font-medium hover:underline">
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.title || <span className="text-default-400">—</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Tab>

      <Tab key="deals" title={`Deals (${org.deals.length})`}>
        <Table aria-label="Deals" removeWrapper classNames={{ th: "bg-content1", td: "py-3" }}>
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Contact</TableColumn>
            <TableColumn align="end">Amount</TableColumn>
            <TableColumn>Stage</TableColumn>
            <TableColumn>Close Date</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No deals yet">
            {org.deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <Link href={`/deals/${deal.id}`} className="text-primary font-medium hover:underline">
                    {deal.name}
                  </Link>
                </TableCell>
                <TableCell>{deal.contact.firstName} {deal.contact.lastName}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(Number(deal.amount))}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" classNames={{ base: `badge-${deal.stage}` }}>
                    {formatStage(deal.stage)}
                  </Chip>
                </TableCell>
                <TableCell>{deal.closeDate ? formatDate(deal.closeDate) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Tab>

      <Tab key="team" title={`Team (${org.users.length})`}>
        <Table aria-label="Team" removeWrapper classNames={{ th: "bg-content1", td: "py-3" }}>
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Role</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No team members">
            {org.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" classNames={{ base: `badge-${user.role}` }}>
                    {formatRole(user.role)}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Tab>
    </Tabs>
  );
}
