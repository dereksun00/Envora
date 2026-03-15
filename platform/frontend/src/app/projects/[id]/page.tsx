"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  Icon,
  Spinner,
  NonIdealState,
} from "@blueprintjs/core"
import { getProject, createSandbox, deleteScenario, duplicateScenario, deleteProject, updateGlossary, regenerateGlossary } from "@/lib/api"
import { ScenarioCard } from "@/components/scenario-card"
import { CreateScenarioDialog } from "@/components/create-scenario-dialog"
import { SandboxTable } from "@/components/sandbox-table"
import type { ProjectWithDetails, Scenario, GlossaryEntry } from "@shared/types"

function SchemaPanel({ schema }: { schema: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = schema.split("\n")
  const preview = lines.slice(0, 12).join("\n")
  const hasMore = lines.length > 12

  return (
    <div className="schema-block">
      <pre>{expanded ? schema : preview}</pre>
      {hasMore && (
        <button className="schema-toggle" onClick={() => setExpanded(!expanded)}>
          <Icon icon={expanded ? "chevron-up" : "chevron-down"} size={12} />
          {expanded ? "Show less" : `Show ${lines.length - 12} more lines`}
        </button>
      )}
    </div>
  )
}

function GlossaryPanel({
  projectId,
  entries,
  onUpdate,
}: {
  projectId: string
  entries: GlossaryEntry[]
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState<GlossaryEntry[]>(entries)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  function addEntry() {
    setItems([...items, { uiLabel: "", schemaMapping: "", description: "" }])
    setEditing(true)
  }

  function removeEntry(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateEntry(i: number, field: keyof GlossaryEntry, value: string) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateGlossary(projectId, items)
      setEditing(false)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      await regenerateGlossary(projectId)
      onUpdate()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate glossary")
    } finally {
      setRegenerating(false)
    }
  }

  if (!editing && entries.length === 0) {
    return (
      <Card className="empty-card">
        <NonIdealState
          icon="translate"
          title="No UI glossary"
          description="Add a glossary so the AI knows what UI terms like 'Pipeline Value' mean in your schema."
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <Button small icon="plus" onClick={addEntry}>Add Manually</Button>
              <Button small intent="primary" icon="refresh" onClick={handleRegenerate} loading={regenerating}>
                Auto-Generate
              </Button>
            </div>
          }
        />
      </Card>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(editing ? items : entries).map((entry, i) => (
          <Card key={i} style={{ padding: "10px 14px" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="bp5-input"
                    placeholder="UI Label"
                    value={entry.uiLabel}
                    onChange={(e) => updateEntry(i, "uiLabel", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="bp5-input"
                    placeholder="Schema mapping (e.g. SUM(Deal.amount))"
                    value={entry.schemaMapping}
                    onChange={(e) => updateEntry(i, "schemaMapping", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <Button small minimal icon="cross" intent="danger" onClick={() => removeEntry(i)} />
                </div>
                <input
                  className="bp5-input"
                  placeholder="Description"
                  value={entry.description}
                  onChange={(e) => updateEntry(i, "description", e.target.value)}
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 600, minWidth: 140 }}>{entry.uiLabel}</span>
                <code style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{entry.schemaMapping}</code>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.description}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {editing ? (
          <>
            <Button small icon="plus" onClick={addEntry}>Add Entry</Button>
            <Button small intent="primary" icon="tick" onClick={handleSave} loading={saving}>Save</Button>
            <Button small onClick={() => { setItems(entries); setEditing(false) }}>Cancel</Button>
          </>
        ) : (
          <>
            <Button small icon="edit" onClick={() => { setItems(entries); setEditing(true) }}>Edit</Button>
            <Button small icon="refresh" onClick={handleRegenerate} loading={regenerating}>Regenerate</Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [launchingScenario, setLaunchingScenario] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editScenario, setEditScenario] = useState<Scenario | null>(null)
  const [deletingProject, setDeletingProject] = useState(false)

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

  async function handleDelete(scenarioId: string) {
    await deleteScenario(params.id, scenarioId)
    load()
  }

  async function handleDuplicate(scenarioId: string) {
    await duplicateScenario(params.id, scenarioId)
    load()
  }

  function handleEdit(scenario: Scenario) {
    setEditScenario(scenario)
    setDialogOpen(true)
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete project "${project?.name}"? This cannot be undone.`)) return
    setDeletingProject(true)
    try {
      await deleteProject(params.id)
      router.push("/projects")
    } finally {
      setDeletingProject(false)
    }
  }

  function handleNewScenario() {
    setEditScenario(null)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner size={30} />
      </div>
    )
  }

  if (!project) return <NonIdealState icon="search" title="Project not found" />

  return (
    <div className="page-container">
      <button className="back-link" onClick={() => router.push("/projects")}>
        <Icon icon="arrow-left" size={14} /> Projects
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle" style={{ fontFamily: "monospace" }}>
            {project.dockerImage} &middot; port {project.appPort}
          </p>
        </div>
        <Button
          intent="danger"
          icon="trash"
          minimal
          loading={deletingProject}
          onClick={handleDeleteProject}
        >
          Delete Project
        </Button>
      </div>

      {/* Schema */}
      <div className="mb-24">
        <h3 className="section-heading">
          Schema ({project.schemaFormat})
        </h3>
        <SchemaPanel schema={project.schema} />
      </div>

      {/* UI Glossary */}
      <div className="mb-24">
        <h3 className="section-heading">UI Glossary</h3>
        <GlossaryPanel
          projectId={params.id}
          entries={project.uiGlossary || []}
          onUpdate={load}
        />
      </div>

      {/* Scenarios */}
      <div className="mb-24">
        <div className="page-header">
          <h3 className="section-heading" style={{ marginBottom: 0 }}>Scenarios</h3>
          <Button small intent="primary" icon="plus" onClick={handleNewScenario}>
            New Scenario
          </Button>
        </div>

        {project.scenarios.length === 0 ? (
          <Card className="empty-card">
            <NonIdealState
              icon="lightbulb"
              title="No scenarios yet"
              description="Create a scenario to define what data the AI should generate."
              action={
                <Button small intent="primary" icon="plus" onClick={handleNewScenario}>
                  New Scenario
                </Button>
              }
            />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onLaunch={handleLaunch}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                launching={launchingScenario === scenario.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sandboxes */}
      {project.sandboxes.length > 0 && (
        <div>
          <h3 className="section-heading">Sandboxes</h3>
          <SandboxTable
            sandboxes={project.sandboxes}
            onRefresh={load}
            emptyMessage="No sandboxes for this project"
          />
        </div>
      )}

      {/* Create/Edit Scenario Dialog */}
      <CreateScenarioDialog
        projectId={params.id}
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditScenario(null)
        }}
        onCreated={load}
        editScenario={editScenario}
      />
    </div>
  )
}
