"use client";

import { CmsTable, type FormField } from "@/components/dashboard/cms-table";

const columns = [
  { key: "title", label: "Title" },
  { key: "slug", label: "Slug" },
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  {
    key: "is_published",
    label: "Status",
    render: (v: boolean) => (
      <span className={v ? "text-green-400" : "text-gray-500"}>
        {v ? "Published" : "Draft"}
      </span>
    ),
  },
];

const formFields: FormField[] = [
  { key: "slug", label: "Slug", type: "text", placeholder: "my-blog-post", required: true },
  { key: "title", label: "Title", type: "text", placeholder: "Blog Post Title", required: true },
  { key: "excerpt", label: "Excerpt", type: "textarea", placeholder: "Brief summary..." },
  { key: "content", label: "Content (Markdown)", type: "textarea", placeholder: "## Full article content..." },
  { key: "date", label: "Date", type: "text", placeholder: "2026-04-16" },
  { key: "read_time", label: "Read Time", type: "text", placeholder: "5 min read" },
  {
    key: "category", label: "Category", type: "select",
    options: [
      { value: "case-study", label: "Case Study" },
      { value: "tutorial", label: "Tutorial" },
      { value: "insight", label: "Insight" },
    ],
  },
  { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "Next.js, TypeScript" },
  {
    key: "cover_gradient", label: "Cover Gradient", type: "select",
    options: [
      { value: "from-blue-600 to-cyan-500", label: "Blue → Cyan" },
      { value: "from-emerald-600 to-teal-500", label: "Emerald → Teal" },
      { value: "from-purple-600 to-pink-500", label: "Purple → Pink" },
      { value: "from-amber-600 to-orange-500", label: "Amber → Orange" },
      { value: "from-rose-600 to-red-500", label: "Rose → Red" },
    ],
  },
  { key: "is_published", label: "Published", type: "checkbox" },
];

export default function BlogAdminPage() {
  return (
    <CmsTable
      endpoint="/api/dashboard/cms/blog"
      columns={columns}
      formFields={formFields}
      title="Blog Posts"
    />
  );
}
