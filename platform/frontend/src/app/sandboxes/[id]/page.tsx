"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Card,
  Icon,
  Spinner,
  Tag,
  Callout,
  Alert,
} from "@blueprintjs/core"
import { getSandbox, destroySandbox } from "@/lib/api"
import type { Sandbox, ProvisioningStep } from "../../../../shared/types"

const STEPS: { key: ProvisioningStep; label: string; icon: string }[] = [
  { key: "creating_database", label: "Creating database", icon: "database" },
  { key: "applying_schema", label: "Applying schema", icon: "th" },
  { key: "generating_data", label: "Generating synthetic data", icon: "clean" },
  { key: "seeding_database", label: "Seeding database", icon: "import" },
  { key: "launching_app", label: "Launching application", icon: "play" },
  { key: "waiting_for_ready", label: "Waiting for app to be ready", icon: "time" },
  { key: "ready", label: "Ready!", icon: "tick-circle" },
]

function getStepIndex(step: ProvisioningStep | null | undefined): number {
  if (!step) return -1
  return STEPS.findIndex((s) => s.key === step)
}

function StepIcon({ state, icon }: { state: string; icon: string }) {
  if (state === "completed")
    return <div className="step-icon completed"><Icon icon="tick" size={14} /></div>
  if (state === "active")
    return <div className="step-icon active"><Spinner size={14} /></div>
  if (state === "failed")
    return <div className="step-icon failed"><Icon icon="cross" size={14} /></div>
  return <div className="step-icon pending"><Icon icon={icon as any} size={12} /></div>
}

export default function SandboxStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [sandbox, setSandbox] = useState<Sandbox | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [destroying, setDestroying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  useEffect(() => {
    getSandbox(params.id)
      .then((data) => {
        setSandbox(data)
        if (data.status !== "running" && data.status !== "failed" && data.status !== "destroyed") {
          intervalRef.current = setInterval(() => {
            getSandbox(params.id).then((updated) => {
              setSandbox(updated)
              if (updated.status === "running" || updated.status === "failed" || updated.status === "destroyed")
                stopPolling()
            })
          }, 2000)
        }
      })
      .finally(() => setLoading(false))
    return stopPolling
  }, [params.id])

  async function handleDestroy() {
    setDestroying(true)
    setConfirmOpen(false)
    try { await destroySandbox(params.id); router.push("/") }
    catch { setDestroying(false) }
  }

  function copyUrl() {
    if (sandbox?.url) {
      navigator.clipboard.writeText(sandbox.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading)
    return <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><Spinner size={30} /></div>
  if (!sandbox) return <div style={{ opacity: 0.6 }}>Sandbox not found.</div>

  const currentStepIndex = getStepIndex(sandbox.currentStep)
  const isRunning = sandbox.status === "running"
  const isFailed = sandbox.status === "failed"

  return (
    <div className="page-container-sm">
      <button className="back-link" onClick={() => router.push("/")}>
        <Icon icon="arrow-left" size={14} /> Dashboard
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Sandbox</h1>
          <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.5, marginTop: 4 }}>{sandbox.id}</p>
        </div>
        <Button small outlined intent="danger" icon="trash" loading={destroying}
          onClick={() => setConfirmOpen(true)}>
          Destroy
        </Button>
      </div>

      {isRunning && sandbox.url && (
        <Callout intent="success" icon="tick-circle" style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 500, marginBottom: 10 }}>Sandbox is ready</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={sandbox.url} target="_blank" rel="noopener noreferrer" className="sandbox-url-bar" style={{ flex: 1 }}>
              <Icon icon="share" size={12} /> {sandbox.url}
            </a>
            <Button small outlined icon={copied ? "tick" : "clipboard"}
              intent={copied ? "success" : "none"} onClick={copyUrl}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </Callout>
      )}

      {isFailed && (
        <Callout intent="danger" icon="error" style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Provisioning failed</p>
          {sandbox.statusMessage && (
            <p style={{ fontSize: 12, fontFamily: "monospace", opacity: 0.6 }}>{sandbox.statusMessage}</p>
          )}
        </Callout>
      )}

      <Card>
        <div className="step-list">
          {STEPS.map((step, index) => {
            let state: string
            if (isRunning) state = "completed"
            else if (isFailed) {
              if (index < currentStepIndex) state = "completed"
              else if (index === currentStepIndex) state = "failed"
              else state = "pending"
            } else {
              if (index < currentStepIndex) state = "completed"
              else if (index === currentStepIndex) state = "active"
              else state = "pending"
            }
            const isLast = index === STEPS.length - 1

            return (
              <div key={step.key}>
                <div className="step-item">
                  <StepIcon state={state} icon={step.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={`step-label ${state}`}>{step.label}</div>
                    {state === "active" && sandbox.statusMessage && (
                      <div className="step-sublabel">{sandbox.statusMessage}</div>
                    )}
                  </div>
                  {state === "completed" && <Tag minimal intent="success" round>done</Tag>}
                </div>
                {!isLast && <div className={`step-connector ${state === "completed" ? "completed" : ""}`} />}
              </div>
            )
          })}
        </div>
      </Card>

      <Alert isOpen={confirmOpen} onConfirm={handleDestroy} onCancel={() => setConfirmOpen(false)}
        intent="danger" icon="trash" confirmButtonText="Destroy" cancelButtonText="Cancel">
        <p>This will stop the container and delete the database. This cannot be undone.</p>
      </Alert>
    </div>
  )
}
