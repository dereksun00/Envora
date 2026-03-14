"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Icon, NonIdealState } from "@blueprintjs/core"
import { listProjects } from "@/lib/api"
import type { Project } from "../../shared/types"

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button intent="primary" icon="plus" onClick={() => router.push("/projects/new")}>
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="empty-card">
          <NonIdealState
            icon="cube"
            title="No projects yet"
            description="Create your first project to start provisioning sandboxes."
            action={
              <Button intent="primary" icon="plus" onClick={() => router.push("/projects/new")}>
                New Project
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <Card
              key={project.id}
              interactive
              className="project-card"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="project-card-title">
                <Icon icon="cube" size={16} style={{ color: "#2d72d2" }} />
                {project.name}
              </div>
              <div className="project-card-meta">{project.dockerImage}</div>
              <div className="project-card-meta" style={{ marginTop: 6 }}>
                Port {project.appPort}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
