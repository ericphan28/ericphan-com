"use client";

import { ExternalLink, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { projects } from "@/lib/data";

const categoryColors: Record<string, string> = {
  saas: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  government: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ai: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  business: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  healthcare: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  infrastructure: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

const categoryLabels: Record<string, string> = {
  saas: "SaaS Platform",
  government: "Government",
  ai: "AI / Automation",
  business: "Business Tools",
  healthcare: "Healthcare",
  infrastructure: "Infrastructure",
};

export function Projects() {
  return (
    <section id="projects" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent font-mono text-sm font-medium">
            {"// Featured Projects"}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
            What I&apos;ve Built
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            Production applications serving real users — from multi-tenant SaaS
            to government digital services.
          </p>
        </motion.div>

        {/* Project grid */}
        <div className="grid gap-8">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              className="group relative rounded-2xl border border-border bg-card hover:bg-card-hover transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="p-6 sm:p-8">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                        categoryColors[project.category]
                      }`}
                    >
                      {categoryLabels[project.category]}
                    </span>
                    <h3 className="mt-3 text-xl sm:text-2xl font-bold group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted font-medium">
                      {project.subtitle}
                    </p>
                  </div>
                  {project.url !== "#" && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-bg text-accent text-sm font-medium hover:bg-accent hover:text-white transition-colors shrink-0"
                    >
                      Visit Site
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Description */}
                <p className="mt-4 text-muted leading-relaxed">
                  {project.description}
                </p>

                {/* Stats */}
                {project.stats && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {project.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center py-3 px-2 rounded-lg bg-background border border-border"
                      >
                        <div className="text-lg font-bold text-accent">
                          {stat.value}
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Highlights */}
                <div className="mt-6">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {project.highlights.map((h) => (
                      <div
                        key={h}
                        className="flex items-start gap-2 text-sm text-muted"
                      >
                        <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-background border border-border text-xs font-mono text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
