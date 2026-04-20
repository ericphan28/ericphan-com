"use client";

import { motion } from "framer-motion";
import { techStack } from "@/lib/data";
import { useTranslation } from "@/lib/i18n/context";

const sectionIcons: Record<string, string> = {
  frontend: "🎨",
  backend: "⚙️",
  devops: "🚀",
  tools: "🔧",
};

export function TechStack() {
  const { t } = useTranslation();
  return (
    <section id="tech" className="py-24 px-6 bg-card">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent font-mono text-sm font-medium">
            {t("tech.sectionTag")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
            {t("tech.heading")}
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            {t("tech.subtitle")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(techStack) as Array<keyof typeof techStack>).map(
            (section, i) => (
              <motion.div
                key={section}
                className="rounded-xl border border-border bg-background p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">{sectionIcons[section]}</span>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">
                    {t(`tech.sections.${section}`)}
                  </h3>
                </div>
                <div className="space-y-3">
                  {techStack[section].map((tech) => (
                    <div
                      key={tech.name}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-card-hover transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-sm font-medium">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
