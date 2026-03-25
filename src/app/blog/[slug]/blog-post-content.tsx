"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import Link from "next/link";
import type { BlogPost } from "@/lib/data";

// Simple markdown-ish renderer for our case study content
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-6 rounded-xl bg-[#0d1117] border border-border p-4 overflow-x-auto"
          >
            <code className="text-sm font-mono text-emerald-400 leading-relaxed">
              {codeLines.join("\n")}
            </code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Tables
    if (line.startsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (line.match(/^\|[\s-|]+\|$/)) continue;

      const cells = line
        .split("|")
        .filter((c) => c.trim())
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      // End table
      elements.push(
        <div key={`table-${i}`} className="my-6 overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-accent-bg">
                {tableRows[0]?.map((cell, ci) => (
                  <th
                    key={ci}
                    className="px-4 py-2.5 text-left font-semibold text-accent"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr
                  key={ri}
                  className="border-t border-border hover:bg-card-hover transition-colors"
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }

    // Empty lines
    if (!line.trim()) continue;

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="mt-12 mb-4 text-2xl sm:text-3xl font-bold gradient-text"
        >
          {line.replace("## ", "")}
        </h2>
      );
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-8 mb-3 text-xl font-semibold">
          {line.replace("### ", "")}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-4 border-l-4 border-accent pl-4 italic text-muted bg-accent-bg/30 py-3 pr-4 rounded-r-lg"
        >
          {line.replace("> ", "")}
        </blockquote>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <div key={`ol-${i}`} className="flex gap-3 my-1.5 ml-1">
          <span className="text-accent font-bold shrink-0">
            {line.match(/^\d+/)?.[0]}.
          </span>
          <span className="text-muted leading-relaxed">
            {renderInline(line.replace(/^\d+\.\s/, ""))}
          </span>
        </div>
      );
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      elements.push(
        <div key={`ul-${i}`} className="flex gap-3 my-1.5 ml-1">
          <span className="text-accent mt-1.5 shrink-0">•</span>
          <span className="text-muted leading-relaxed">
            {renderInline(line.replace("- ", ""))}
          </span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-4 text-muted leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  // Close any pending table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="table-end" className="my-6 overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-accent-bg">
              {tableRows[0]?.map((cell, ci) => (
                <th
                  key={ci}
                  className="px-4 py-2.5 text-left font-semibold text-accent"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr
                key={ri}
                className="border-t border-border hover:bg-card-hover transition-colors"
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-muted">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return elements;
}

// Inline formatting: **bold**, `code`, links
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Split by patterns: **bold**, `code`, [text](url)
  const regex = /(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={match.index} className="text-foreground font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-accent-bg text-accent font-mono text-sm"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function BlogPostContent({ post }: { post: BlogPost }) {
  return (
    <article className="min-h-screen">
      {/* Hero */}
      <div
        className={`relative bg-gradient-to-br ${post.coverGradient} py-20 sm:py-28`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/#blog"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
              Case Study
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-white/70 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-medium"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderContent(post.content)}
        </motion.div>

        {/* Author card */}
        <motion.div
          className="mt-16 rounded-2xl border border-border bg-card p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
              E
            </div>
            <div>
              <h3 className="font-bold text-lg">Eric Phan</h3>
              <p className="text-sm text-muted mt-1">
                Full-Stack Developer & Digital Transformation Consultant.
                Building production SaaS platforms, government digital services,
                and AI-powered tools.
              </p>
              <div className="mt-3 flex gap-3">
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
                >
                  Hire Me
                </Link>
                <a
                  href="https://github.com/ericphan28"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-card-hover transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/#blog"
            className="inline-flex items-center gap-2 text-muted hover:text-accent text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
        </div>
      </div>
    </article>
  );
}
