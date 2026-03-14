"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  Tag,
  Icon,
  Spinner,
  Alert,
  NonIdealState,
} from "@blueprintjs/core"
import { getProject, createSandbox, destroySandbox } from "@/lib/api"
import type { ProjectWithDetails, Sandbox, SandboxStatus } from "../../../../shared/types"

function statusTag(status: SandboxStatus) {
  const map = {
    running: "success" as const,
    provisioning: "warning" as const,
    failed: "danger" as const,
    destroyed: "none" as const,
  }
  return <Tag intent={map[status]} minimal round>{status}</Tag>
}

function SchemaPanel({ schema }: { schema: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = schema.split("\n")
  const preview = lines.slice(0, 20).join("\n")
  const hasMore = lines.length > 20

  return (
    <div className="schema-block">
      <pre>{expanded ? schema : preview}</pre>
      {hasMore && (
        <button className="schema-toggle" onClick={() => setExpanded(!expanded)}>
          <Icon icon={expanded ? "chevron-up" : "chevron-down"} size={12} />
          {expanded ? "Show less" : `Show ${lines.length - 20} more lines`}
        </button>
      )}
    </div>
  )
}

function SandboxRow({ sandbox, onDestroy }: { sandbox: Sandbox; onDestroy: () => void }) {
  const router = useRouter()
  const [destroying, setDestroying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDestroy() {
    setDestroying(true)
    setConfirmOpen(false)
    try {
      await destroySandbox(sandbox.id)
      onDestroy()
    } catch {
      setDestroying(false)
    }
  }

  return (
    <>
      <div className="sandbox-row">
        <div className="sandbox-row-left">
          {statusTag(sandbox.status)}
          <span className="sandbox-id" onClick={() => router.push(`/sandboxes/${sandbox.id}`)}>
            {sandbox.id.slice(0, 12)}
          </span>
          {sandbox.url && (
            <a href={sandbox.url} target="_blank" rel="noopener noreferrer" className="sandbox-url">
              <Icon icon="share" size={10} /> {sandbox.url}
            </a>
          )}
        </div>
        <div className="sandbox-row-right">
          <span className="sandbox-time">{new Date(sandbox.createdAt).toLocaleString()}</span>
          {sandbox.status !== "destroyed" && (
            <Button small minimal intent="danger" icon="trash" loading={destroying}
              onClick={() => setConfirmOpen(true)}>
              Destroy
            </Button>
          )}
        </div>
      </div>
      <Alert isOpen={confirmOpen} onConfirm={handleDestroy} onCancel={() => setConfirmOpen(false)}
        intent="danger" icon="trash" confirmButtonText="Destroy" cancelButtonText="Cancel">
        <p>This will stop the container and delete the database. This cannot be undone.</p>
      </Alert>
    </>
  )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [launchingScenario, setLaunchingScenario] = useState<string | null>(null)

  function load() {
    getProject(params.id).then(setProject).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [params.id])

  async function handleLaunch(scenarioId: string) {
    setLaunchingScenario(scenarioId)
    try {
      const sandbox = await createSandbox({ projectId: params.id, scenarioId })
      router.push(`/sandboxes/${sandbox.id}`)
    } catch {
      setLaunchingScenario(null)
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><Spinner size={30} /></div>
  if (!project) return <NonIdealState icon="search" title="Project not found" />

  return (
    <div className="page-container">
      <button className="back-link" onClick={() => router.push("/")}>
        <Icon icon="arrow-left" size={14} /> Back to Dashboard
      </button>

      <h1 className="page-title">{project.name}</h1>
      <p className="page-subtitle" style={{ fontFamily: "monospace" }}>{project.dockerImage}</p>

      {/* Schema */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.5, marginBottom: 12 }}>
          Schema ({project.schemaFormat})
        </h3>
        <SchemaPanel schema={project.schema} />
      </div>

      {/* Scenarios */}
      <div style={{ marginTop: 32 }}>
        <div className="page-header">
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Scenarios</h2>
          <Button small intent="primary" icon="plus"
            onClick={() => router.push(`/projects/${params.id}/scenarios/new`)}>
            New Scenario
          </Button>
        </div>

        {project.scenarios.length === 0 ? (
          <Card className="empty-card">
            <NonIdealState icon="lightbulb" title="No scenarios yet"
              description="Create a scenario to define what data the AI should generate."
              action={<Button small intent="primary" icon="plus"
                onClick={() => router.push(`/projects/${params.id}/scenarios/new`)}>New Scenario</Button>} />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.scenarios.map((scenario) => (
              <Card key={scenario.id} className="scenario-card">
                <div className="scenario-info">
                  <p className="scenario-name">{scenario.name}</p>
                  <p className="scenario-prompt">{scenario.prompt}</p>
                  {scenario.demoUsers && scenario.demoUsers.length > 0 && (
                    <div className="scenario-meta">
                      <Icon icon="people" size={12} />
                      {scenario.demoUsers.length} demo user{scenario.demoUsers.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <Button intent="success" icon={launchingScenario === scenario.id ? undefined : "rocket-slant"}
                  loading={launchingScenario === scenario.id}
                  onClick={() => handleLaunch(scenario.id)}>
                  Launch Sandbox
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sandboxes */}
      {project.sandboxes.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Sandboxes</h2>
          <Card style={{ padding: "0 20px" }}>
            {project.sandboxes.map((sb) => (
              <SandboxRow key={sb.id} sandbox={sb} onDestroy={load} />
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
