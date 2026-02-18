'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import nameMap from '../../../lib/nameMap.json';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    placeholder?: string;
    onSelect: (name: string, group: string, rollNo: string) => void;
    showGroup?: boolean;
}

export default function SearchBar({
    placeholder = 'Search for a student...',
    onSelect,
    showGroup = true,
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedName, setSelectedName] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Filter suggestions
    useEffect(() => {
        if (query.trim().length > 0 && query !== selectedName) {
            const filtered = Object.keys(nameMap).filter(name =>
                name.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 50));
            setIsOpen(true);
            setActiveIndex(-1);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    }, [query, selectedName]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectStudent = useCallback((name: string) => {
        setQuery(name);
        setSelectedName(name);
        setIsOpen(false);
        const data = nameMap[name as keyof typeof nameMap];
        if (data) {
            onSelect(name, data[0], data[1]);
        }
    }, [onSelect]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => {
                const next = prev < suggestions.length - 1 ? prev + 1 : 0;
                scrollToItem(next);
                return next;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => {
                const next = prev > 0 ? prev - 1 : suggestions.length - 1;
                scrollToItem(next);
                return next;
            });
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            selectStudent(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const scrollToItem = (index: number) => {
        if (listRef.current) {
            const item = listRef.current.children[index] as HTMLElement;
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.inputWrapper}>
                <svg
                    className={styles.searchIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelectedName(''); }}
                    onFocus={() => {
                        if (query.trim().length > 0 && suggestions.length > 0) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={styles.input}
                    autoComplete="off"
                />
                {query.length > 0 && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => { setQuery(''); setSelectedName(''); }}
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className={styles.suggestions} ref={listRef}>
                    {suggestions.map((name, i) => {
                        const data = nameMap[name as keyof typeof nameMap];
                        return (
                            <li
                                key={name}
                                onClick={() => selectStudent(name)}
                                className={`${styles.item} ${i === activeIndex ? styles.itemActive : ''}`}
                            >
                                <span className={styles.itemName}>{name}</span>
                                {showGroup && data && (
                                    <span className={styles.itemMeta}>Group {data[0]}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
