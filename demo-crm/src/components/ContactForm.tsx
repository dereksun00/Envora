"use client";

import { Input, Select, SelectItem, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Org {
  id: string;
  name: string;
}

interface ContactFormProps {
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    title: string | null;
    organizationId: string;
  };
}

export default function ContactForm({ contact }: ContactFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);

  const [firstName, setFirstName] = useState(contact?.firstName || "");
  const [lastName, setLastName] = useState(contact?.lastName || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [title, setTitle] = useState(contact?.title || "");
  const [organizationId, setOrganizationId] = useState(contact?.organizationId || "");

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then(setOrgs);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { firstName, lastName, email, phone: phone || null, title: title || null, organizationId };
    const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
    const method = contact ? "PUT" : "POST";

    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    router.push("/contacts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-row">
        <Input
          label="First Name"
          variant="bordered"
          value={firstName}
          onValueChange={setFirstName}
          placeholder="John"
          isRequired
        />
        <Input
          label="Last Name"
          variant="bordered"
          value={lastName}
          onValueChange={setLastName}
          placeholder="Doe"
          isRequired
        />
      </div>

      <Input
        label="Email"
        variant="bordered"
        type="email"
        value={email}
        onValueChange={setEmail}
        placeholder="john@example.com"
        isRequired
      />

      <div className="form-row">
        <Input
          label="Phone"
          variant="bordered"
          type="tel"
          value={phone}
          onValueChange={setPhone}
          placeholder="+1 (555) 123-4567"
        />
        <Input
          label="Title"
          variant="bordered"
          value={title}
          onValueChange={setTitle}
          placeholder="VP of Sales"
        />
      </div>

      <Select
        label="Organization"
        variant="bordered"
        placeholder="Select organization"
        selectedKeys={organizationId ? [organizationId] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          setOrganizationId(selected || "");
        }}
        isRequired
      >
        {orgs.map((org) => (
          <SelectItem key={org.id}>{org.name}</SelectItem>
        ))}
      </Select>

      <div className="form-actions">
        <Button type="submit" color="primary" isLoading={loading}>
          {contact ? "Update Contact" : "Create Contact"}
        </Button>
        <Button variant="flat" onPress={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
