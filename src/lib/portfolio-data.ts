// Portfolio data layer — fetches from Supabase CMS with static fallback
// Used by public-facing portfolio pages (SSR/ISR)

import { projects as staticProjects, services as staticServices, blogPosts as staticBlogPosts } from "./data";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Simple REST fetch from Supabase PostgREST (no client needed) */
async function supabaseRest(table: string, params: string = ""): Promise<any[] | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });
    if (!res.ok) return null;
    return await res.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    return null;
  }
}

/** Fetch projects — Supabase CMS first, then static fallback */
export async function getProjects() {
  const rows = await supabaseRest(
    "portfolio_projects",
    "is_published=eq.true&order=sort_order,created_at.desc"
  );

  if (rows && rows.length > 0) {
    return rows.map((r: any) => ({
      id: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      url: r.url,
      image: r.image,
      tags: r.tags || [],
      category: r.category,
      stats: r.stats || [],
      highlights: r.highlights || [],
    }));
  }

  return staticProjects;
}

/** Fetch services — Supabase CMS first, then static fallback */
export async function getServices() {
  const rows = await supabaseRest(
    "portfolio_services",
    "is_published=eq.true&order=sort_order"
  );

  if (rows && rows.length > 0) {
    return rows.map((r: any) => ({
      key: r.key,
      title: r.title,
      description: r.description,
      icon: r.icon,
      priceUSD: r.price_usd ? Number(r.price_usd) : null,
    }));
  }

  return staticServices;
}

/** Fetch blog posts — Supabase CMS first, then static fallback */
export async function getBlogPosts() {
  const rows = await supabaseRest(
    "portfolio_blog_posts",
    "is_published=eq.true&order=date.desc"
  );

  if (rows && rows.length > 0) {
    return rows.map((r: any) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      date: r.date,
      readTime: r.read_time,
      category: r.category,
      tags: r.tags || [],
      coverGradient: r.cover_gradient,
      content: r.content,
    }));
  }

  return staticBlogPosts;
}
