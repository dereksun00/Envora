"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  FormGroup,
  InputGroup,
  TextArea,
  ButtonGroup,
  Callout,
  Icon,
} from "@blueprintjs/core"
import { createProject } from "@/lib/api"
import type { SchemaFormat } from "../../../shared/types"

export default function CreateProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [dockerImage, setDockerImage] = useState("")
  const [schema, setSchema] = useState("")
  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>("prisma")
  const [appPort, setAppPort] = useState(3000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const project = await createProject({ name, dockerImage, schema, schemaFormat, appPort })
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container-sm">
      <button className="back-link" onClick={() => router.back()}>
        <Icon icon="arrow-left" size={14} /> Back
      </button>

      <h1 className="page-title mb-24">New Project</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Project name" labelFor="name">
            <InputGroup
              id="name"
              large
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My CRM Demo"
              required
            />
          </FormGroup>

          <FormGroup label="Docker image" labelFor="dockerImage">
            <InputGroup
              id="dockerImage"
              large
              leftIcon="box"
              value={dockerImage}
              onChange={(e) => setDockerImage(e.target.value)}
              placeholder="yourname/demo-crm:latest"
              required
            />
          </FormGroup>

          <FormGroup
            label="Schema"
            labelFor="schema"
            labelInfo={
              <ButtonGroup minimal small style={{ marginLeft: 8 }}>
                <Button active={schemaFormat === "prisma"} onClick={() => setSchemaFormat("prisma")} small>
                  Prisma
                </Button>
                <Button active={schemaFormat === "sql"} onClick={() => setSchemaFormat("sql")} small>
                  SQL
                </Button>
              </ButtonGroup>
            }
          >
            <TextArea
              id="schema"
              className="mono-input"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder={
                schemaFormat === "prisma"
                  ? "model User {\n  id Int @id @default(autoincrement())\n  ...\n}"
                  : "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  ...\n);"
              }
              rows={16}
              fill
              growVertically={false}
              required
            />
          </FormGroup>

          <FormGroup label="App port" labelFor="appPort">
            <InputGroup
              id="appPort"
              large
              type="number"
              value={String(appPort)}
              onChange={(e) => setAppPort(Number(e.target.value))}
              style={{ maxWidth: 160 }}
            />
          </FormGroup>

          {error && (
            <Callout intent="danger" icon="error" className="mb-16">
              {error}
            </Callout>
          )}

          <div className="form-actions">
            <Button large onClick={() => router.back()}>Cancel</Button>
            <Button large intent="primary" type="submit" loading={submitting} icon="tick">
              Create Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
