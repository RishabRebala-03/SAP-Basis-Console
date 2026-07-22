import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface SearchableFilterDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | FilterOption)[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

export function SearchableFilterDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Search options…",
  allLabel = "All Options",
  className = "",
}: SearchableFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt === "" ? allLabel : opt };
    }
    return {
      value: opt.value,
      label: opt.label || (opt.value === "" ? allLabel : opt.value),
    };
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const filteredOptions = normalizedOptions.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const displayLabel = selectedOption && selectedOption.label ? selectedOption.label : allLabel;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && <p className="text-xs mb-1 text-gray-500 font-medium">{label}</p>}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-800 flex items-center justify-between gap-1 text-left focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors"
      >
        <span className="truncate" style={{ color: value ? "#32363a" : "#74777a" }}>
          {displayLabel}
        </span>
        <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded shadow-xl z-50 bg-white border border-gray-200 overflow-hidden min-w-[170px]">
          {/* Inner search input */}
          <div className="p-1.5 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-7 pr-6 py-1 text-xs rounded border border-gray-300 bg-white text-gray-800 outline-none focus:border-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                      isSelected ? "font-semibold text-blue-600 bg-blue-50/60" : "text-gray-700"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={12} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
