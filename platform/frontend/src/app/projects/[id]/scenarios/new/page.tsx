"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  FormGroup,
  InputGroup,
  TextArea,
  Callout,
  Icon,
} from "@blueprintjs/core"
import { createScenario } from "@/lib/api"
import type { DemoUser } from "../../../../../shared/types"

export default function CreateScenarioPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addUser() {
    setDemoUsers([...demoUsers, { name: "", email: "", role: "" }])
  }

  function removeUser(index: number) {
    setDemoUsers(demoUsers.filter((_, i) => i !== index))
  }

  function updateUser(index: number, field: keyof DemoUser, value: string) {
    setDemoUsers(demoUsers.map((u, i) => (i === index ? { ...u, [field]: value } : u)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createScenario(params.id, {
        name,
        prompt,
        demoUsers: demoUsers.filter((u) => u.name || u.email),
      })
      router.push(`/projects/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scenario")
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container-sm">
      <button className="back-link" onClick={() => router.back()}>
        <Icon icon="arrow-left" size={14} /> Back
      </button>

      <h1 className="page-title mb-24">New Scenario</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Scenario name" labelFor="name">
            <InputGroup
              id="name"
              large
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q4 Sales Demo"
              required
            />
          </FormGroup>

          <FormGroup
            label="Data generation prompt"
            labelFor="prompt"
            helperText="Describe the data you want AI to generate for this sandbox."
          >
            <TextArea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Generate a realistic CRM database for a mid-size B2B SaaS company with 50 contacts, 20 deals in various pipeline stages, and 3 months of activity history..."
              rows={8}
              fill
              growVertically={false}
              required
            />
          </FormGroup>

          <FormGroup label="Demo users">
            {demoUsers.length === 0 && (
              <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 12 }}>
                No demo users. Add users to pre-create login accounts in the sandbox.
              </p>
            )}
            {demoUsers.map((user, index) => (
              <div key={index} className="demo-user-row">
                <InputGroup
                  value={user.name}
                  onChange={(e) => updateUser(index, "name", e.target.value)}
                  placeholder="Name"
                />
                <InputGroup
                  value={user.email}
                  onChange={(e) => updateUser(index, "email", e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
                <InputGroup
                  className="role-input"
                  value={user.role}
                  onChange={(e) => updateUser(index, "role", e.target.value)}
                  placeholder="Role"
                />
                <Button minimal icon="cross" intent="danger" onClick={() => removeUser(index)} />
              </div>
            ))}
            <Button small outlined icon="plus" onClick={addUser} style={{ marginTop: 4 }}>
              Add User
            </Button>
          </FormGroup>

          {error && (
            <Callout intent="danger" icon="error" className="mb-16">
              {error}
            </Callout>
          )}

          <div className="form-actions">
            <Button large onClick={() => router.back()}>Cancel</Button>
            <Button large intent="primary" type="submit" loading={submitting} icon="tick">
              Create Scenario
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
