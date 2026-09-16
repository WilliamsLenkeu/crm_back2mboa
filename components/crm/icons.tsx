/** Bootstrap Icons — classes `bi bi-*` */
export const ICONS = {
  menu: "bi-list",
  search: "bi-search",
  dashboard: "bi-grid-1x2",
  users: "bi-people",
  pipeline: "bi-kanban",
  settings: "bi-gear",
  export: "bi-download",
  plus: "bi-plus-lg",
  logout: "bi-box-arrow-right",
  collapse: "bi-layout-sidebar-inset",
  expand: "bi-layout-sidebar",
} as const;

export function Bi({
  name,
  className = "",
  title,
}: {
  name: string;
  className?: string;
  title?: string;
}) {
  return <i className={`bi ${name} ${className}`.trim()} aria-hidden={!title} title={title} />;
}
