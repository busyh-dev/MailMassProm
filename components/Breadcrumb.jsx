import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center text-sm mb-6 text-slate-500 dark:text-slate-400">
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 opacity-60" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-blue-600 dark:hover:text-emerald-400 font-medium"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
