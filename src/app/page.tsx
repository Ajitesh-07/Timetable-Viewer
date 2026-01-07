'use client';
import React, { useEffect, useRef, useState } from "react";
import nameMap from '../../lib/nameMap.json';
import timetable from '../../lib/timetable/schedule.json';
import styles from "./page.module.css";
import { useRouter } from "next/navigation"
import Head from "next/head";

interface TimetableSlot {
  time: string;
  course: string;
  groups: string;
  location: string;
}

interface Student {
  name: string;
  group: number;
  timetable: TimetableSlot[];
}

type ScheduleEntry = {
  timeStart: string;
  timeEnd: string;
  CourseName: string;
  GroupStart: string;
  GroupEnd: string;
  type: string;
};

interface SpecialEntry {
  timeStart: string;
  timeEnd: string;
  names: string[];
  CourseName: string;
  type: string;
}

type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

function cleanTime(a: string) {
  let newTime = ""
  if (a[1] == ':') {
    newTime = "0";
    newTime += a;
    return newTime;
  } else return a;
}

function formatTo12Hour(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${m} ${ampm}`;
}

function getTimetable(schedule: ScheduleEntry[], specialSchedule: SpecialEntry[], group: number, name: string): ScheduleEntry[] {
  const interestedCourses = schedule.filter(course => {
    const start = parseInt(course.GroupStart, 10);
    const end = parseInt(course.GroupEnd, 10);
    return group >= start && group <= end && course.CourseName.toUpperCase() != "HSS";
  });

  const intrestedSpecials = specialSchedule.filter(course => {
    return course.names.includes(name);
  });

  const mappedSpecials: ScheduleEntry[] = intrestedSpecials.map(course => ({
    timeStart: course.timeStart,
    timeEnd: course.timeEnd,
    CourseName: course.CourseName,
    type: course.type,
    GroupStart: "SPECIAL",
    GroupEnd: "SPECIAL",
  }));

  const allCourses = [...interestedCourses, ...mappedSpecials];

  return allCourses.sort((a, b) => {
    const timeA = new Date(`1970-01-01T${cleanTime(a.timeStart)}:00`);
    const timeB = new Date(`1970-01-01T${cleanTime(b.timeStart)}:00`);
    return timeA.getTime() - timeB.getTime();
  });
}

function getSchedule(schedule: ScheduleEntry[], name: string, group: string): Student {
  const timetableSlot = schedule.map(entry => ({
    // Updated to use the 12-hour format helper
    time: `${formatTo12Hour(entry.timeStart)} - ${formatTo12Hour(entry.timeEnd)}`,
    course: entry.CourseName,
    groups: (entry.GroupStart === "SPECIAL")
      ? "Special"
      : `${entry.GroupStart} to ${entry.GroupEnd}`,
    location: entry.type
  }));

  return {
    name: name,
    group: parseInt(group),
    timetable: timetableSlot
  };
}

const TimetablePage = () => {
  const d = new Date();
  const daysOfWeek: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayNumber = d.getDay();
  let dayName: WeekDay = 'monday';
  if (dayNumber < 5 && dayNumber > 0) dayName = daysOfWeek[dayNumber - 1];

  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setSuggestionsVisible] = useState<boolean>(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState<{ name: string; group: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeekDay>(dayName);

  // Refs
  const daySelectorRef = useRef<HTMLDivElement>(null);
  const downloadDivRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim().length > 0 && searchQuery !== (selectedStudentInfo?.name || '')) {
      const filtered = Object.keys(nameMap).filter(student =>
        student.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setSuggestionsVisible(true);
    } else {
      setSuggestions([]);
      setSuggestionsVisible(false);
    }
  }, [searchQuery, selectedStudentInfo]);

  // Schedule Update Logic
  useEffect(() => {
    if (selectedStudentInfo) {
      const { name, group } = selectedStudentInfo;
      const daySchedule = timetable[selectedDay as keyof typeof timetable]?.Schedule as ScheduleEntry[] || [];
      const specialSchedule = timetable[selectedDay as keyof typeof timetable]?.Special as SpecialEntry[] || [];
      
      // Fallback for missing data
      if (!daySchedule && !specialSchedule) return;

      const relevantCourses = getTimetable(daySchedule, specialSchedule, parseInt(group), name);
      const studentSchedule = getSchedule(relevantCourses, name, group);
      setSelectedStudent(studentSchedule);
    }
  }, [selectedStudentInfo, selectedDay]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestionsVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (studentName: string) => {
    setSearchQuery(studentName);
    const groupNo: string = nameMap[studentName as keyof typeof nameMap][0];
    setSelectedStudentInfo({ name: studentName, group: groupNo });
    setSelectedDay(dayName);
    setSuggestionsVisible(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0 && suggestions.length > 0) {
      setSuggestionsVisible(true);
    }
  };

  const handleRouter = () => {
    router.push('/endsem')
  }

  return (
    <>
      <Head>
        <title>Timetable finder</title>
        <meta name="description" content="Find your weekly student timetable" />
      </Head>

      <main>
        <div className={`${styles.pageContainer}`}>

          <main className={styles.mainContent}>
            <h1 className={styles.title}>Student Timetable Finder 🗓️</h1>
            <p className={styles.subtitle}>
              Enter a student name to view their weekly schedule.
              Click <a className={styles.routerLink} onClick={handleRouter}>here</a> to check your ENDSEM schedule
            </p>

            <div className={styles.searchContainer} ref={searchContainerRef}>
              <div className={styles.inputWrapper}>
                <svg
                  className={styles.searchIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  placeholder="Ex Aditya"
                  className={styles.searchInput}
                  autoComplete="off"
                />
              </div>
              {isSuggestionsVisible && suggestions.length > 0 && (
                <ul className={styles.suggestionsList}>
                  {suggestions.map((student) => (
                    <li
                      key={student}
                      onClick={() => handleSuggestionClick(student)}
                      className={styles.suggestionItem}
                    >
                      {student}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={downloadDivRef} className={styles.downloadContainer}>
              {selectedStudent && (
                <div className={styles.timetableContainer}>
                  <div className={styles.studentHeader}>
                    <h2 className={styles.studentName}>{selectedStudent.name}</h2>
                    <span className={styles.studentGroup}>
                      Group: {selectedStudent.group}
                    </span>
                  </div>

                  <div className={styles.daySelector} ref={daySelectorRef}>
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day as WeekDay)}
                        className={`${styles.dayButton} ${selectedDay === day ? styles.active : ''}`}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.timetable}>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Course</th>
                          <th>Groups</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.timetable.length > 0 ? (
                          selectedStudent.timetable.map((slot, idx) => (
                            <tr key={idx}>
                              <td>{slot.time}</td>
                              <td>{slot.course}</td>
                              <td>{slot.groups}</td>
                              <td>{slot.location}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className={styles.noClassesCell}>No classes scheduled for today. ✨</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>

          <footer className={styles.footer}>
            <p>Made with ❤️ by Ajitesh (AI&DS)</p>
          </footer>

        </div>
      </main>
    </>
  );
};

export default TimetablePage;