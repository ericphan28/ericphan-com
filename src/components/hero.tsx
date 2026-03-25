"use client";

import { ArrowDown, ExternalLink, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float [animation-delay:3s]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-accent/30 shadow-xl shadow-accent/10 glow">
            <Image
              src="/images/avatar.jpg"
              alt="Eric Phan"
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-bg border border-accent/20 text-accent text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Available for freelance work
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="mt-6 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Hi, I&apos;m{" "}
          <span className="gradient-text">Eric Phan</span>
        </motion.h1>

        {/* Title */}
        <motion.p
          className="mt-4 text-xl sm:text-2xl text-muted font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Senior Full-Stack Developer
        </motion.p>

        {/* Description */}
        <motion.p
          className="mt-6 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          I build <strong className="text-foreground">production SaaS platforms</strong>,{" "}
          <strong className="text-foreground">government portals</strong>, and{" "}
          <strong className="text-foreground">AI-powered tools</strong> with{" "}
          Next.js, TypeScript, Supabase &amp; Vercel.
        </motion.p>

        {/* Stats row */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {[
            { value: "630+", label: "API Routes" },
            { value: "6+", label: "Live Projects" },
            { value: "20K+", label: "Users Served" },
            { value: "50+", label: "DB Tables" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40"
          >
            View My Work
            <ArrowDown className="w-4 h-4" />
          </a>
          <a
            href="https://chogiakiem.vn/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-card transition-colors"
          >
            Live Demo
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted"
        >
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </div>
    </section>
  );
}
