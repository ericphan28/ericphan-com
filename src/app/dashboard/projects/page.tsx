"use client";

import { CmsTable, type FormField } from "@/components/dashboard/cms-table";

const columns = [
  { key: "title", label: "Title" },
  { key: "slug", label: "Slug" },
  { key: "category", label: "Category" },
  {
    key: "is_published",
    label: "Status",
    render: (v: boolean) => (
      <span className={v ? "text-green-400" : "text-gray-500"}>
        {v ? "Published" : "Draft"}
      </span>
    ),
  },
  { key: "sort_order", label: "Order" },
];

const formFields: FormField[] = [
  { key: "slug", label: "Slug", type: "text", placeholder: "my-project", required: true },
  { key: "title", label: "Title", type: "text", placeholder: "Project Title", required: true },
  { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Short subtitle" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Full description..." },
  { key: "url", label: "URL", type: "text", placeholder: "https://..." },
  { key: "image", label: "Image URL", type: "text", placeholder: "https://..." },
  {
    key: "category", label: "Category", type: "select",
    options: [
      { value: "saas", label: "SaaS Platform" },
      { value: "government", label: "Government" },
      { value: "ai", label: "AI / Automation" },
      { value: "business", label: "Business Tools" },
      { value: "healthcare", label: "Healthcare" },
      { value: "infrastructure", label: "Infrastructure" },
    ],
  },
  { key: "tags", label: "Tags (comma-separated)", type: "tags", placeholder: "Next.js, TypeScript, Supabase" },
  { key: "highlights", label: "Highlights (comma-separated)", type: "tags", placeholder: "Feature 1, Feature 2" },
  { key: "sort_order", label: "Sort Order", type: "number" },
  { key: "is_published", label: "Published", type: "checkbox" },
];

export default function ProjectsAdminPage() {
  return (
    <CmsTable
      endpoint="/api/dashboard/cms/projects"
      columns={columns}
      formFields={formFields}
      title="Projects"
    />
  );
}
