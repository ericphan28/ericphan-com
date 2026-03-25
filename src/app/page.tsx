import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { TechStack } from "@/components/tech-stack";
import { Services } from "@/components/services";
import { Blog } from "@/components/blog";
import { Contact } from "@/components/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Projects />
      <TechStack />
      <Services />
      <Blog />
      <Contact />
    </>
  );
}
