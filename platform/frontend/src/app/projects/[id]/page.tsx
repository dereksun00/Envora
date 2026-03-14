"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, ChevronDown, ChevronUp, ExternalLink, Rocket } from "lucide-react"
import { getProject, createSandbox, destroySandbox } from "@/lib/api"
import type { ProjectWithDetails, Sandbox, SandboxStatus } from "@shared/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

function statusBadge(status: SandboxStatus) {
  switch (status) {
    case "running": return <Badge variant="success">running</Badge>
    case "provisioning": return <Badge variant="warning">provisioning</Badge>
    case "failed": return <Badge variant="destructive">failed</Badge>
    case "destroyed": return <Badge variant="secondary">destroyed</Badge>
  }
}

function SchemaPanel({ schema }: { schema: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = schema.split("\n")
  const preview = lines.slice(0, 20).join("\n")
  const hasMore = lines.length > 20

  return (
    <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
      <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre">
        {expanded ? schema : preview}
      </pre>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-4 py-2 w-full text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors"
        >
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {lines.length - 20} more lines</>}
        </button>
      )}
    </div>
  )
}

function SandboxRow({ sandbox, onDestroy }: { sandbox: Sandbox; onDestroy: () => void }) {
  const [destroying, setDestroying] = useState(false)

  async function handleDestroy() {
    setDestroying(true)
    try {
      await destroySandbox(sandbox.id)
      onDestroy()
    } catch {
      setDestroying(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {statusBadge(sandbox.status)}
        <span className="text-xs text-muted-foreground font-mono">{sandbox.id.slice(0, 8)}</span>
        {sandbox.url && (
          <a
            href={sandbox.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-foreground hover:text-muted-foreground truncate"
          >
            <ExternalLink size={10} className="shrink-0" />
            {sandbox.url}
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <span className="text-xs text-muted-foreground">{new Date(sandbox.createdAt).toLocaleString()}</span>
        {sandbox.status !== "destroyed" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                Destroy
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Destroy sandbox?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will stop the container and delete the database. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDestroy} disabled={destroying}>
                  {destroying ? "Destroying..." : "Destroy"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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

  function load() {
    getProject(params.id)
      .then(setProject)
      .finally(() => setLoading(false))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={24} className="text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return <div className="text-muted-foreground">Project not found.</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="font-mono text-sm text-muted-foreground mt-1">{project.dockerImage}</p>
      </div>

      {/* Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Schema ({project.schemaFormat})</CardTitle>
        </CardHeader>
        <CardContent>
          <SchemaPanel schema={project.schema} />
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scenarios</h2>
          <Button size="sm" onClick={() => router.push(`/projects/${params.id}/scenarios/new`)}>
            <Plus size={14} />
            New Scenario
          </Button>
        </div>

        {project.scenarios.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">No scenarios yet. Create one to generate sandbox data.</p>
            <Button size="sm" onClick={() => router.push(`/projects/${params.id}/scenarios/new`)}>
              <Plus size={14} />
              New Scenario
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {project.scenarios.map((scenario) => (
              <Card key={scenario.id} className="overflow-hidden">
                <CardContent className="py-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm text-muted-foreground break-all mt-0.5">{scenario.prompt}</p>
                    {scenario.demoUsers && scenario.demoUsers.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{scenario.demoUsers.length} demo user{scenario.demoUsers.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLaunch(scenario.id)}
                    disabled={launchingScenario === scenario.id}
                  >
                    {launchingScenario === scenario.id ? (
                      <><Spinner size={14} /> Launching...</>
                    ) : (
                      <><Rocket size={14} /> Launch Sandbox</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sandboxes */}
      {project.sandboxes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Sandboxes</h2>
          <Card>
            <CardContent className="py-0 px-5">
              {project.sandboxes.map((sandbox) => (
                <SandboxRow key={sandbox.id} sandbox={sandbox} onDestroy={load} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
