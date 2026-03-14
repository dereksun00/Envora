"use client";

import { Input, Select, SelectItem, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Org {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

interface User {
  id: string;
  name: string;
}

interface DealFormProps {
  deal?: {
    id: string;
    name: string;
    amount: string | number;
    stage: string;
    closeDate: string | null;
    organizationId: string;
    contactId: string;
    ownerId: string;
  };
}

const stages = [
  { value: "prospecting", label: "Prospecting" },
  { value: "qualification", label: "Qualification" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

export default function DealForm({ deal }: DealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState(deal?.name || "");
  const [amount, setAmount] = useState(deal?.amount?.toString() || "");
  const [stage, setStage] = useState(deal?.stage || "");
  const [closeDate, setCloseDate] = useState(
    deal?.closeDate ? new Date(deal.closeDate).toISOString().split("T")[0] : ""
  );
  const [organizationId, setOrganizationId] = useState(deal?.organizationId || "");
  const [contactId, setContactId] = useState(deal?.contactId || "");
  const [ownerId, setOwnerId] = useState(deal?.ownerId || "");

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then(setOrgs);
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/organizations").then((r) => r.json()).then((orgsData: Org[]) => {
      const userPromises = orgsData.map((org: Org) =>
        fetch(`/api/organizations/${org.id}`).then((r) => r.json())
      );
      Promise.all(userPromises).then((orgDetails) => {
        const allUsers = orgDetails.flatMap((o: { users?: User[] }) => o.users || []);
        const uniqueUsers = Array.from(
          new Map(allUsers.map((u: User) => [u.id, u])).values()
        );
        setUsers(uniqueUsers);
      });
    });
  }, []);

  const filteredContacts = organizationId
    ? contacts.filter((c) => c.organizationId === organizationId)
    : contacts;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      amount: parseFloat(amount),
      stage,
      closeDate: closeDate || null,
      organizationId,
      contactId,
      ownerId,
    };

    const url = deal ? `/api/deals/${deal.id}` : "/api/deals";
    const method = deal ? "PUT" : "POST";

    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    router.push("/deals");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <Input
        label="Deal Name"
        variant="bordered"
        value={name}
        onValueChange={setName}
        placeholder="Enter deal name"
        isRequired
      />

      <div className="form-row">
        <Input
          label="Amount ($)"
          variant="bordered"
          type="number"
          value={amount}
          onValueChange={setAmount}
          placeholder="0"
          min={0}
          step={1}
          isRequired
        />
        <Select
          label="Stage"
          variant="bordered"
          placeholder="Select stage"
          selectedKeys={stage ? [stage] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setStage(selected || "");
          }}
          isRequired
        >
          {stages.map((s) => (
            <SelectItem key={s.value}>{s.label}</SelectItem>
          ))}
        </Select>
      </div>

      <Input
        label="Close Date"
        variant="bordered"
        type="date"
        value={closeDate}
        onValueChange={setCloseDate}
      />

      <Select
        label="Organization"
        variant="bordered"
        placeholder="Select organization"
        selectedKeys={organizationId ? [organizationId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          setOrganizationId(selected || "");
          setContactId("");
        }}
        isRequired
      >
        {orgs.map((org) => (
          <SelectItem key={org.id}>{org.name}</SelectItem>
        ))}
      </Select>

      <Select
        label={`Contact${organizationId ? ` (${filteredContacts.length} available)` : ""}`}
        variant="bordered"
        placeholder="Select contact"
        selectedKeys={contactId ? [contactId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          setContactId(selected || "");
        }}
        isRequired
      >
        {filteredContacts.map((c) => (
          <SelectItem key={c.id}>{c.firstName} {c.lastName}</SelectItem>
        ))}
      </Select>

      <Select
        label="Owner"
        variant="bordered"
        placeholder="Select owner"
        selectedKeys={ownerId ? [ownerId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          setOwnerId(selected || "");
        }}
        isRequired
      >
        {users.map((u) => (
          <SelectItem key={u.id}>{u.name}</SelectItem>
        ))}
      </Select>

      <div className="form-actions">
        <Button type="submit" color="primary" isLoading={loading}>
          {deal ? "Update Deal" : "Create Deal"}
        </Button>
        <Button variant="flat" onPress={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
