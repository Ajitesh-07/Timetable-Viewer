"use client";

import React, { ChangeEvent, useEffect, useState } from 'react';
import styles from './page.module.css';
import nameMap from '@/../lib/nameMap.json';
import timetable from '@/../lib/timetable/schedule.json';

// --- TYPE DEFINITIONS ---
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

function getTimetable(schedule: Course[], students: Student[]): Course[] {
  const interestedCourses = schedule.filter(course => {
    const start = parseInt(course.GroupStart, 10);
    const end = parseInt(course.GroupEnd, 10);
    if(course.CourseName.toUpperCase() == "HSS") return false;
    let possible = true;

    students.map(student => {
        if(!(student.group >= start && student.group <= end)) {
            possible = false;
        } 
    });
    return possible;
  });

  return interestedCourses.sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.timeStart}:00`);
    const timeB = new Date(`1970-01-01T${b.timeStart}:00`);
    return timeA.getTime() - timeB.getTime();
  });
}

// function getSchedule(schedule: Course[], name: string, group: string): Student {
//   const timetableSlot = schedule.map(entry => ({
//     time: `${entry.timeStart} - ${entry.timeEnd}`,
//     course: entry.CourseName,
//     groups: `${entry.GroupStart} to ${entry.GroupEnd}`,
//     location: entry.type
//   }));

//   return {
//     name: name,
//     group: parseInt(group),
//     timetable: timetableSlot
//   };
// }

export default function ScheduleComparer() {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [commonCourses, setCommonCourses] = useState<Course[]>({} as Course[]);
    const [hasCompared, setHasCompared] = useState<boolean>(false);
    const [activeDay, setActiveDay] = useState<WeekDay>(weekDays[0]);

    const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
        const term = e.target.value;
        setSearchTerm(term);
        setHasCompared(false);
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }


        const searchRes = Object.entries(nameMap)
            .filter(([key]) => key.toLowerCase().includes(term.toLowerCase()))
            .map(([key, index]) => ({
                name: key,
                group: parseInt(index)
            }));

        setSearchResults(searchRes as Student[]);

    };

    const addStudent = (student: Student): void => {
        setSelectedStudents(prev => [...prev, student]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeStudent = (name: string): void => {
        setSelectedStudents(prev => prev.filter(s => s.name !== name));
        setHasCompared(false);
    };

    const compareSchedules = (): void => {
        if (selectedStudents.length < 2) {
            alert('Select at least two students.');
            return;
        }

        setCommonCourses(getTimetable(timetable[activeDay.toLowerCase() as keyof typeof timetable].Schedule as Course[], selectedStudents));

        setHasCompared(true);
    };

    useEffect(() => {
        setCommonCourses(getTimetable(timetable[activeDay.toLowerCase() as keyof typeof timetable].Schedule as Course[], selectedStudents));
    }, [activeDay, selectedStudents, hasCompared]);

    return (
        <main className={styles.container}>
            {/* Search & Selection */}
            <div className={styles.card}>
                <h1 className={styles.title}>📅 Schedule Sync</h1>
                <p className={styles.subtitle}>Find common classes between students.</p>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search for a student..."
                        className={styles.searchInput}
                    />
                    {searchResults.length > 0 && (
                        <ul className={styles.searchResultsList}>
                            {searchResults.map(s => (
                                <li key={s.name} onClick={() => addStudent(s)} className={styles.searchResultItem}>
                                    {s.name} <span className={styles.groupInfo}>(Group {s.group})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.selectionArea}>
                    {selectedStudents.map(s => (
                        <div key={s.name} className={styles.selectedStudent}>
                            {s.name}
                            <button onClick={() => removeStudent(s.name)} className={styles.removeButton}>&times;</button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={compareSchedules}
                    disabled={selectedStudents.length < 2}
                    className={styles.compareButton}
                >
                    {selectedStudents.length < 2 ? 'Add another student' : 'Find Common Classes'}
                </button>
            </div>

            {/* Results by Day with Table */}
            {hasCompared && (
                <div className={styles.resultsContainer}>
                    <div className={styles.tabList}>
                        {weekDays.map(day => (
                            <button
                                key={day}
                                className={day === activeDay ? styles.activeTab : styles.tabItem}
                                onClick={() => setActiveDay(day)}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {commonCourses?.length > 0 ? (
                        <table className={styles.courseTable}>
                            <thead>
                                <tr>
                                    <th>TIME</th>
                                    <th>COURSE</th>
                                    <th>GROUPS</th>
                                    <th>LOCATION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commonCourses.map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.timeStart} - {c.timeEnd}</td>
                                        <td>{c.CourseName}</td>
                                        <td>{c.GroupStart} to {c.GroupEnd}</td>
                                        <td>{c.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className={styles.noResults}>No common courses on {activeDay}.</p>
                    )}
                </div>
            )}
        </main>
    );
};