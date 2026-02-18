'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/', label: 'Schedule' },
    { href: '/midsem', label: 'Midsem' },
    { href: '/compare', label: 'Compare' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className={styles.navbar}>
            <div className={styles.inner}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandText}>IITP Timetable</span>
                </Link>

                <ul className={styles.links}>
                    {navLinks.map(link => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
