"use client";

import { Input, Select, SelectItem, Textarea, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface Deal {
  id: string;
  name: string;
}

const activityTypes = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

export default function ActivityForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [userId, setUserId] = useState("");
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/deals").then((r) => r.json()).then(setDeals);
    fetch("/api/organizations").then((r) => r.json()).then((orgs) => {
      const userPromises = orgs.map((org: { id: string }) =>
        fetch(`/api/organizations/${org.id}`).then((r) => r.json())
      );
      Promise.all(userPromises).then((orgDetails) => {
        const allUsers: User[] = orgDetails.flatMap((o: { users?: User[] }) => o.users || []);
        const uniqueUsers = Array.from(new Map(allUsers.map((u) => [u.id, u])).values());
        setUsers(uniqueUsers);
      });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type,
      subject,
      description: description || null,
      date,
      userId,
      contactId: contactId || null,
      dealId: dealId || null,
    };

    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.push("/activities");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-row">
        <Select
          label="Type"
          variant="bordered"
          placeholder="Select type"
          selectedKeys={type ? [type] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setType(selected || "");
          }}
          isRequired
        >
          {activityTypes.map((t) => (
            <SelectItem key={t.value}>{t.label}</SelectItem>
          ))}
        </Select>
        <Input
          label="Date"
          variant="bordered"
          type="date"
          value={date}
          onValueChange={setDate}
          isRequired
        />
      </div>

      <Input
        label="Subject"
        variant="bordered"
        value={subject}
        onValueChange={setSubject}
        placeholder="Follow-up call"
        isRequired
      />

      <Textarea
        label="Description"
        variant="bordered"
        value={description}
        onValueChange={setDescription}
        placeholder="Notes about this activity..."
      />

      <Select
        label="User"
        variant="bordered"
        placeholder="Select user"
        selectedKeys={userId ? [userId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          setUserId(selected || "");
        }}
        isRequired
      >
        {users.map((u) => (
          <SelectItem key={u.id}>{u.name}</SelectItem>
        ))}
      </Select>

      <div className="form-row">
        <Select
          label="Contact (optional)"
          variant="bordered"
          placeholder="Select contact"
          selectedKeys={contactId ? [contactId] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setContactId(selected || "");
          }}
        >
          {contacts.map((c) => (
            <SelectItem key={c.id} textValue={`${c.firstName} ${c.lastName}`}>
              {c.firstName} {c.lastName}
            </SelectItem>
          ))}
        </Select>
        <Select
          label="Deal (optional)"
          variant="bordered"
          placeholder="Select deal"
          selectedKeys={dealId ? [dealId] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setDealId(selected || "");
          }}
        >
          {deals.map((d) => (
            <SelectItem key={d.id}>{d.name}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="form-actions">
        <Button type="submit" color="primary" isLoading={loading}>
          Create Activity
        </Button>
        <Button variant="flat" onPress={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
