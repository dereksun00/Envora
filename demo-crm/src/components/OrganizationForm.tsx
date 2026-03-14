"use client";

import { Input, Select, SelectItem, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const sizes = [
  { value: "startup", label: "Startup" },
  { value: "mid_market", label: "Mid Market" },
  { value: "enterprise", label: "Enterprise" },
];

interface OrgFormProps {
  org?: {
    id: string;
    name: string;
    industry: string;
    size: string;
    website: string | null;
  };
}

export default function OrganizationForm({ org }: OrgFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(org?.name || "");
  const [industry, setIndustry] = useState(org?.industry || "");
  const [size, setSize] = useState(org?.size || "");
  const [website, setWebsite] = useState(org?.website || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = { name, industry, size, website: website || null };
    const url = org ? `/api/organizations/${org.id}` : "/api/organizations";
    const method = org ? "PUT" : "POST";

    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    router.push("/organizations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <Input
        label="Organization Name"
        variant="bordered"
        value={name}
        onValueChange={setName}
        placeholder="Acme Inc"
        isRequired
      />

      <div className="form-row">
        <Input
          label="Industry"
          variant="bordered"
          value={industry}
          onValueChange={setIndustry}
          placeholder="Technology"
          isRequired
        />
        <Select
          label="Size"
          variant="bordered"
          placeholder="Select size"
          selectedKeys={size ? [size] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setSize(selected || "");
          }}
          isRequired
        >
          {sizes.map((s) => (
            <SelectItem key={s.value}>{s.label}</SelectItem>
          ))}
        </Select>
      </div>

      <Input
        label="Website"
        variant="bordered"
        type="url"
        value={website}
        onValueChange={setWebsite}
        placeholder="https://example.com"
      />

      <div className="form-actions">
        <Button type="submit" color="primary" isLoading={loading}>
          {org ? "Update Organization" : "Create Organization"}
        </Button>
        <Button variant="flat" onPress={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
