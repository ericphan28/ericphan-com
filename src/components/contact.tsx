"use client";

import { motion } from "framer-motion";
import { Mail, MessageSquare, Clock, Send } from "lucide-react";
import { GitHubIcon, LinkedInIcon, FreelancerIcon } from "@/components/icons";

export function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-card">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent font-mono text-sm font-medium">
            {"// Get In Touch"}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
            Let&apos;s Build Something Great
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            Have a project in mind? I&apos;m available for freelance work and
            always excited to discuss new opportunities.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact info */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background">
              <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center text-accent shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <a
                  href="mailto:ericphan28@gmail.com"
                  className="text-sm text-muted hover:text-accent transition-colors"
                >
                  ericphan28@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background">
              <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center text-accent shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Chat with me</h3>
                <div className="flex items-center gap-3 mt-1">
                  <a
                    href="https://github.com/ericphan28"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="GitHub"
                  >
                    <GitHubIcon className="w-5 h-5" />
                  </a>
                  <a
                    href="https://linkedin.com/in/ericphan28"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.freelancer.com/u/ericphan28"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="Freelancer"
                  >
                    <FreelancerIcon className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background">
              <div className="w-10 h-10 rounded-lg bg-accent-bg flex items-center justify-center text-accent shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Response Time</h3>
                <p className="text-sm text-muted">
                  Usually within 2-4 hours (UTC+7)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.form
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            action="https://formspree.io/f/placeholder"
            method="POST"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="project" className="block text-sm font-medium mb-1.5">
                Project Type
              </label>
              <select
                id="project"
                name="project"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              >
                <option value="">Select a category</option>
                <option value="saas">SaaS / Web Application</option>
                <option value="website">Website / Landing Page</option>
                <option value="ai">AI Integration / Automation</option>
                <option value="deployment">Deployment / DevOps</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
                placeholder="Tell me about your project..."
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-all shadow-lg shadow-accent/25"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
