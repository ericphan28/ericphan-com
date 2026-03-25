import { Mail, Heart } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              T
            </div>
            <span className="font-bold text-sm">
              thang<span className="text-accent">phan</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#projects" className="hover:text-foreground transition-colors">Projects</a>
            <a href="#tech" className="hover:text-foreground transition-colors">Tech Stack</a>
            <a href="#services" className="hover:text-foreground transition-colors">Services</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ericphan28"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/in/ericphan28"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="w-4 h-4" />
            </a>
            <a
              href="mailto:ericphan28@gmail.com"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()} Thang Phan. Built with
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            using Next.js + Tailwind + Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
