"use client";

import { motion } from "framer-motion";
import {
  Layers,
  Code2,
  Building2,
  Brain,
  Rocket,
  ShieldCheck,
  Table,
  Database,
  TrendingUp,
  TerminalSquare,
} from "lucide-react";
import { services } from "@/lib/data";
import { useTranslation } from "@/lib/i18n/context";
import { useCurrency } from "@/lib/currency/context";

const iconMap: Record<string, React.ReactNode> = {
  layers: <Layers className="w-6 h-6" />,
  code: <Code2 className="w-6 h-6" />,
  building: <Building2 className="w-6 h-6" />,
  brain: <Brain className="w-6 h-6" />,
  rocket: <Rocket className="w-6 h-6" />,
  shield: <ShieldCheck className="w-6 h-6" />,
  table: <Table className="w-6 h-6" />,
  database: <Database className="w-6 h-6" />,
  trending: <TrendingUp className="w-6 h-6" />,
  terminal: <TerminalSquare className="w-6 h-6" />,
};

export function Services() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  return (
    <section id="services" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent font-mono text-sm font-medium">
            {t("services.sectionTag")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
            {t("services.heading")}
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              className="rounded-xl border border-border bg-card p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent-bg flex items-center justify-center text-accent mb-4">
                {iconMap[service.icon]}
              </div>
              <h3 className="text-lg font-semibold">{t(`services.items.${service.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {t(`services.items.${service.key}.description`)}
              </p>
              {service.priceUSD && (
                <p className="mt-3 text-xs font-medium text-accent">
                  {t("services.startingFrom")} {formatPrice(service.priceUSD)}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
