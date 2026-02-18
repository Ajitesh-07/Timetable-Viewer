"use client";

import React, { ChangeEvent, useEffect, useState } from 'react';
import styles from './page.module.css';
import nameMap from '@/../lib/nameMap.json';
import timetable from '@/../lib/timetable/schedule.json';

interface Student {
    name: string;
    group: number;
}

interface Course {
    timeStart: string;
    timeEnd: string;
    GroupStart: string;
    GroupEnd: string;
    CourseName: string;
    type: string;
}

type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
const weekDays: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function formatTo12Hour(time: string): string {
    if (!time) return "";
    const [h, m] = time.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
}

function getTimetable(schedule: Course[], students: Student[]): Course[] {
    const interestedCourses = schedule.filter(course => {
        const start = parseInt(course.GroupStart, 10);
        const end = parseInt(course.GroupEnd, 10);
        if (course.CourseName.toUpperCase() === "HSS") return false;
        return students.every(s => s.group >= start && s.group <= end);
    });

    return interestedCourses.sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.timeStart}:00`);
        const timeB = new Date(`1970-01-01T${b.timeStart}:00`);
        return timeA.getTime() - timeB.getTime();
    });
}

export default function ScheduleComparer() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [commonCourses, setCommonCourses] = useState<Course[]>([]);
    const [hasCompared, setHasCompared] = useState(false);
    const [activeDay, setActiveDay] = useState<WeekDay>(weekDays[0]);

    const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
        const term = e.target.value;
        setSearchTerm(term);
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchResults(
            Object.entries(nameMap)
                .filter(([key]) => key.toLowerCase().includes(term.toLowerCase()))
                .slice(0, 30)
                .map(([key, index]) => ({ name: key, group: parseInt(index[0]) }))
        );
    };

    const addStudent = (student: Student): void => {
        if (selectedStudents.find(s => s.name === student.name)) return;
        setSelectedStudents(prev => [...prev, student]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeStudent = (name: string): void => {
        setSelectedStudents(prev => prev.filter(s => s.name !== name));
    };

    // Auto-compare when 2+ students selected
    useEffect(() => {
        if (selectedStudents.length >= 2) {
            const schedule = timetable[activeDay.toLowerCase() as keyof typeof timetable]?.Schedule as Course[] || [];
            setCommonCourses(getTimetable(schedule, selectedStudents));
            setHasCompared(true);
        } else {
            setHasCompared(false);
            setCommonCourses([]);
        }
    }, [activeDay, selectedStudents]);

    return (
        <main className={styles.page}>
            <div className={styles.hero}>
                <h1 className={styles.title}>
                    Schedule
                    <span className={styles.titleAccent}> Sync</span>
                </h1>
                <p className={styles.subtitle}>
                    Find common classes between students
                </p>
            </div>

            <div className={styles.card}>
                {/* Search */}
                <div className={styles.searchSection}>
                    <div className={styles.searchContainer}>
                        <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Add students to compare..."
                            className={styles.searchInput}
                            autoComplete="off"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <ul className={styles.searchResults}>
                            {searchResults.map(s => (
                                <li key={s.name} onClick={() => addStudent(s)} className={styles.resultItem}>
                                    <span>{s.name}</span>
                                    <span className={styles.groupTag}>Group {s.group}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Selected students */}
                {selectedStudents.length > 0 && (
                    <div className={styles.selectedArea}>
                        {selectedStudents.map(s => (
                            <div key={s.name} className={styles.chip}>
                                <span>{s.name}</span>
                                <button onClick={() => removeStudent(s.name)} className={styles.chipRemove}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}

                {selectedStudents.length < 2 && selectedStudents.length > 0 && (
                    <p className={styles.hint}>Add one more student to compare schedules</p>
                )}
            </div>

            {/* Results */}
            {hasCompared && (
                <div className={styles.resultsCard}>
                    <div className={styles.dayTabs}>
                        {weekDays.map(day => (
                            <button
                                key={day}
                                className={`${styles.dayTab} ${day === activeDay ? styles.dayTabActive : ''}`}
                                onClick={() => setActiveDay(day)}
                            >
                                {day.slice(0, 3)}
                            </button>
                        ))}
                    </div>

                    {commonCourses.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Course</th>
                                        <th>Groups</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commonCourses.map((c, i) => (
                                        <tr key={i}>
                                            <td className={styles.timeCell}>{formatTo12Hour(c.timeStart)} - {formatTo12Hour(c.timeEnd)}</td>
                                            <td><span className={styles.courseName}>{c.CourseName}</span></td>
                                            <td>{c.GroupStart} to {c.GroupEnd}</td>
                                            <td><span className={styles.locationBadge}>{c.type}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.noResults}>
                            <p>No common courses on {activeDay}</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}