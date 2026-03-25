"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import Link from "next/link";
import { blogPosts } from "@/lib/data";

const categoryStyles: Record<string, string> = {
  "case-study":
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  tutorial:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  insight:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

const categoryLabels: Record<string, string> = {
  "case-study": "Case Study",
  tutorial: "Tutorial",
  insight: "Insight",
};

export function Blog() {
  return (
    <section id="blog" className="py-24 px-6 bg-card">
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
            {"// Writing & Case Studies"}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
            How I Build Things
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            Deep dives into real projects — architecture decisions, technical
            challenges, and lessons learned.
          </p>
        </motion.div>

        {/* Blog grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {blogPosts.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-border bg-background hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 overflow-hidden"
              >
                {/* Cover gradient */}
                <div
                  className={`h-40 bg-gradient-to-br ${post.coverGradient} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-white/90 dark:bg-black/60 ${categoryStyles[post.category]}`}
                    >
                      {categoryLabels[post.category]}
                    </span>
                  </div>
                  {/* Decorative code pattern */}
                  <div className="absolute top-4 right-4 font-mono text-white/20 text-xs leading-relaxed hidden sm:block">
                    <div>{"const build = () => {"}</div>
                    <div>{"  // architecture"}</div>
                    <div>{"  // decisions"}</div>
                    <div>{"  return <Impact />"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg sm:text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>

                  <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-bg text-accent text-xs font-medium"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Read more */}
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-3 transition-all">
                    Read Case Study
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
