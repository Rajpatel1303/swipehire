import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  badge?: string;
  description?: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  variant?: "pill" | "card" | "subtle";
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  id?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon: LeadingIcon,
  label,
  variant = "pill",
  size = "md",
  align = "left",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  searchable,
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto-enable search if there are more than 7 options unless explicitly specified
  const isSearchable = searchable ?? options.length > 7;

  // Filter options if searchable
  const filteredOptions = isSearchable && searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.badge?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isSearchable]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3.5 py-2 text-xs gap-2",
    lg: "px-4 py-2.5 text-sm gap-2.5",
  };

  const variantClasses = {
    pill: "rounded-full bg-white border-2 border-slate-200 hover:border-slate-300 shadow-2xs",
    card: "rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs",
    subtle: "rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100",
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`} id={id}>
      {label && (
        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between font-black uppercase tracking-wider text-slate-800 transition-all cursor-pointer select-none ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${
          isOpen ? "border-slate-900 ring-2 ring-slate-900/10 shadow-sm" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {LeadingIcon && <LeadingIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ml-1.5 ${
            isOpen ? "rotate-180 text-slate-900" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[220px] w-max max-w-[340px] bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {/* Search bar inside dropdown if many options */}
          {isSearchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl">
                <Search className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter..."
                  className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="py-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                const OptionIcon = option.icon;

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white font-black"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    } ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {OptionIcon && (
                        <OptionIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-white" : "text-slate-400"
                          }`}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate">{option.label}</div>
                        {(option.description || option.sublabel) && (
                          <div
                            className={`text-[10px] font-normal truncate mt-0.5 ${
                              isSelected ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {option.description || option.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {option.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>
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