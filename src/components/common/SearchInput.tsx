
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIconLucide, UserCircle, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { AnimatedList } from '@/components/magicui/animated-list';
import UserAvatar from '@/components/common/UserAvatar';

export interface SearchSuggestion {
  id: string;
  label: string;
  type?: 'user' | 'file' | 'message' | 'conversation' | 'post'; 
  href?: string; 
  imageUrl?: string; // Added for user suggestions
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (searchTerm: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string; 
  inputClassName?: string; 
  suggestions?: SearchSuggestion[];
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  isLoadingSuggestions?: boolean;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search...",
  className,
  inputClassName,
  suggestions = [],
  onSuggestionClick,
  isLoadingSuggestions = false,
  autoFocus = false,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const showSuggestions = isFocused && value.length > 0 && (suggestions.length > 0 || isLoadingSuggestions);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
    setIsFocused(false); 
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const getSuggestionIcon = (type?: SearchSuggestion['type']) => {
    switch (type) {
      case 'user': return <UserCircle className="h-5 w-5 text-muted-foreground" />;
      case 'file': return <FileText className="h-5 w-5 text-muted-foreground" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
      case 'post': return <FileText className="h-5 w-5 text-muted-foreground" />;
      default: return <SearchIconLucide className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleFormSubmit}
      className={cn("relative w-full", className)}
    >
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={cn(
            "h-10 w-full rounded-full border border-input bg-background py-2 pr-10 pl-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-md",
            inputClassName 
          )}
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-80 overflow-y-auto">
          {isLoadingSuggestions ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            <AnimatedList className="space-y-1" delay={100}>
              {suggestions.map((suggestion) => {
                if (suggestion.type === 'user') {
                  // Use profileImage and username for UserAvatar, with fixed size and proper alignment
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
                      onClick={() => onSuggestionClick?.(suggestion)}
                    >
                      <UserAvatar
                        user={{ profileImage: suggestion.imageUrl, username: suggestion.label }}
                        size="sm"
                        className="h-8 w-8 rounded-full object-cover border border-muted"
                        fallbackClassName="text-base"
                      />
                      <span className="text-sm text-popover-foreground truncate">{suggestion.label}</span>
                    </button>
                  );
                }
                // Default for other types
                const content = (
                  <div className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors">
                    {getSuggestionIcon(suggestion.type)}
                    <span className="text-sm text-popover-foreground truncate">{suggestion.label}</span>
                  </div>
                );
                if (suggestion.href) {
                  return (
                    <Link key={suggestion.id} href={suggestion.href} onClick={() => onSuggestionClick?.(suggestion)} className="block cursor-pointer">
                      {content}
                    </Link>
                  );
                }
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full text-left cursor-pointer"
                    onClick={() => onSuggestionClick?.(suggestion)}
                  >
                    {content}
                  </button>
                );
              })}
            </AnimatedList>
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">No suggestions found.</div>
          )}
        </div>
      )}
    </form>
  );
}
