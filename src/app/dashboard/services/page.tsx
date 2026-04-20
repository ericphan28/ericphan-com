"use client";

import { CmsTable, type FormField } from "@/components/dashboard/cms-table";

const columns = [
  { key: "key", label: "Key" },
  { key: "title", label: "Title" },
  { key: "icon", label: "Icon" },
  {
    key: "price_usd",
    label: "Price (USD)",
    render: (v: number | null) => v ? `$${v}` : "—",
  },
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
  { key: "key", label: "Key (unique)", type: "text", placeholder: "saas", required: true },
  { key: "title", label: "Title", type: "text", placeholder: "SaaS Development", required: true },
  { key: "description", label: "Description", type: "textarea", placeholder: "Service description..." },
  {
    key: "icon", label: "Icon", type: "select",
    options: [
      { value: "layers", label: "Layers" },
      { value: "code", label: "Code" },
      { value: "building", label: "Building" },
      { value: "brain", label: "Brain" },
      { value: "rocket", label: "Rocket" },
      { value: "shield", label: "Shield" },
    ],
  },
  { key: "price_usd", label: "Starting Price (USD)", type: "number", placeholder: "500" },
  { key: "sort_order", label: "Sort Order", type: "number" },
  { key: "is_published", label: "Published", type: "checkbox" },
];

export default function ServicesAdminPage() {
  return (
    <CmsTable
      endpoint="/api/dashboard/cms/services"
      columns={columns}
      formFields={formFields}
      title="Services"
    />
  );
}
