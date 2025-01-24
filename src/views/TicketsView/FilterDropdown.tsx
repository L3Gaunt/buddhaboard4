import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  getOptionColor: (value: string) => string;
  searchable?: boolean;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  getOptionColor,
  searchable = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const toggleAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {label} {selected.length > 0 && `(${selected.length})`}
        </span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2">
            {searchable && (
              <div className="px-2 pb-2 mb-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <label className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 mr-2"
                checked={selected.length === options.length}
                onChange={toggleAll}
              />
              <span className="text-sm font-medium">Select All</span>
            </label>
            <div className="my-1 border-t border-gray-200" />
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 mr-2"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                  />
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full ${getOptionColor(option.value)}`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
              {searchable && filteredOptions.length === 0 && (
                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                  No agents found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
