'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import timetable from '../../lib/timetable/schedule.json';
import styles from "./page.module.css";
import SearchBar from "./components/SearchBar";

interface TimetableSlot {
  time: string;
  course: string;
  groups: string;
  location: string;
  timeStartRaw: string;
  timeEndRaw: string;
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
  if (a[1] === ':') return '0' + a;
  return a;
}

function formatTo12Hour(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

function getTimetable(schedule: ScheduleEntry[], specialSchedule: SpecialEntry[], group: number, name: string): ScheduleEntry[] {
  const interestedCourses = schedule.filter(course => {
    const start = parseInt(course.GroupStart, 10);
    const end = parseInt(course.GroupEnd, 10);
    return group >= start && group <= end && course.CourseName.toUpperCase() !== "HSS";
  });

  const interestedSpecials = specialSchedule.filter(course =>
    course.names.includes(name)
  );

  const mappedSpecials: ScheduleEntry[] = interestedSpecials.map(course => ({
    timeStart: course.timeStart,
    timeEnd: course.timeEnd,
    CourseName: course.CourseName,
    type: course.type,
    GroupStart: "SPECIAL",
    GroupEnd: "SPECIAL",
  }));

  return [...interestedCourses, ...mappedSpecials].sort((a, b) => {
    const timeA = new Date(`1970-01-01T${cleanTime(a.timeStart)}:00`);
    const timeB = new Date(`1970-01-01T${cleanTime(b.timeStart)}:00`);
    return timeA.getTime() - timeB.getTime();
  });
}

function getSchedule(schedule: ScheduleEntry[], name: string, group: string): Student {
  const timetableSlot = schedule.map(entry => ({
    time: `${formatTo12Hour(entry.timeStart)} - ${formatTo12Hour(entry.timeEnd)}`,
    course: entry.CourseName,
    groups: entry.GroupStart === "SPECIAL" ? "Special" : `${entry.GroupStart} to ${entry.GroupEnd}`,
    location: entry.type,
    timeStartRaw: entry.timeStart,
    timeEndRaw: entry.timeEnd,
  }));

  return { name, group: parseInt(group), timetable: timetableSlot };
}

function getClassStatus(timeStart: string, timeEnd: string): 'active' | 'next' | 'past' | 'upcoming' {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentMinutes = h * 60 + m;

  const [sh, sm] = timeStart.split(':').map(Number);
  const [eh, em] = timeEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (currentMinutes >= startMin && currentMinutes < endMin) return 'active';
  if (currentMinutes < startMin && startMin - currentMinutes <= 30) return 'next';
  if (currentMinutes < startMin) return 'upcoming';
  return 'past';
}

function getFreeSlots(slots: TimetableSlot[]): { after: string; duration: string }[] {
  const freeSlots: { after: string; duration: string }[] = [];
  for (let i = 0; i < slots.length - 1; i++) {
    const [eh, em] = slots[i].timeEndRaw.split(':').map(Number);
    const [sh, sm] = slots[i + 1].timeStartRaw.split(':').map(Number);
    const gap = (sh * 60 + sm) - (eh * 60 + em);
    if (gap > 5) {
      const hours = Math.floor(gap / 60);
      const mins = gap % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
      freeSlots.push({ after: slots[i].course, duration: durationStr.trim() });
    }
  }
  return freeSlots;
}

function isToday(day: WeekDay): boolean {
  const d = new Date();
  const dayNumber = d.getDay();
  const daysOfWeek: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  if (dayNumber < 1 || dayNumber > 5) return false;
  return daysOfWeek[dayNumber - 1] === day;
}

const TimetablePage = () => {
  const d = new Date();
  const daysOfWeek: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayNumber = d.getDay();
  let defaultDay: WeekDay = 'monday';
  if (dayNumber >= 1 && dayNumber <= 5) defaultDay = daysOfWeek[dayNumber - 1];

  const [selectedStudentInfo, setSelectedStudentInfo] = useState<{ name: string; group: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeekDay>(defaultDay);
  const downloadDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedStudentInfo) {
      const { name, group } = selectedStudentInfo;
      const daySchedule = timetable[selectedDay as keyof typeof timetable]?.Schedule as ScheduleEntry[] || [];
      const specialSchedule = timetable[selectedDay as keyof typeof timetable]?.Special as SpecialEntry[] || [];
      if (!daySchedule && !specialSchedule) return;
      const relevantCourses = getTimetable(daySchedule, specialSchedule, parseInt(group), name);
      const studentSchedule = getSchedule(relevantCourses, name, group);
      setSelectedStudent(studentSchedule);
    }
  }, [selectedStudentInfo, selectedDay]);

  const handleSelect = useCallback((name: string, group: string) => {
    setSelectedStudentInfo({ name, group });
    setSelectedDay(defaultDay);
  }, [defaultDay]);

  const handleDownload = async () => {
    if (!downloadDivRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(downloadDivRef.current, {
      backgroundColor: '#13131e',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `${selectedStudent?.name || 'timetable'}_${selectedDay}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const freeSlots = selectedStudent ? getFreeSlots(selectedStudent.timetable) : [];
  const showToday = isToday(selectedDay);

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Student Schedule
          <span className={styles.titleAccent}> Finder</span>
        </h1>
        <p className={styles.subtitle}>
          Search for any student to view their weekly class timetable
        </p>
      </div>

      <div className={styles.searchArea}>
        <SearchBar
          placeholder="Search by student name..."
          onSelect={handleSelect}
        />
      </div>

      {selectedStudent && (
        <div className={styles.resultArea} ref={downloadDivRef}>
          <div className={styles.card}>
            {/* Student header */}
            <div className={styles.cardHeader}>
              <div className={styles.headerInfo}>
                <h2 className={styles.studentName}>{selectedStudent.name}</h2>
                <span className={styles.badge}>Group {selectedStudent.group}</span>
              </div>
              <button className={styles.downloadBtn} onClick={handleDownload} title="Download as image">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save
              </button>
            </div>

            {/* Day selector */}
            <div className={styles.daySelector}>
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`${styles.dayBtn} ${selectedDay === day ? styles.dayActive : ''}`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  {isToday(day) && <span className={styles.todayDot} />}
                </button>
              ))}
            </div>

            {/* Free slots summary */}
            {freeSlots.length > 0 && (
              <div className={styles.freeSlotsBar}>
                <span className={styles.freeLabel}>Free slots:</span>
                {freeSlots.map((slot, i) => (
                  <span key={i} className={styles.freeChip}>
                    {slot.duration} after {slot.after}
                  </span>
                ))}
              </div>
            )}

            {/* Timetable */}
            {/* Desktop table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Groups</th>
                    <th>Location</th>
                    {showToday && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.timetable.length > 0 ? (
                    selectedStudent.timetable.map((slot, idx) => {
                      const status = showToday ? getClassStatus(slot.timeStartRaw, slot.timeEndRaw) : 'upcoming';
                      return (
                        <tr key={idx} className={showToday ? styles[`row_${status}`] : ''}>
                          <td className={styles.timeCell}>{slot.time}</td>
                          <td>
                            <span className={styles.courseName}>{slot.course}</span>
                          </td>
                          <td>{slot.groups}</td>
                          <td>
                            <span className={styles.locationBadge}>{slot.location}</span>
                          </td>
                          {showToday && (
                            <td>
                              {status === 'active' && <span className={styles.statusActive}>Now</span>}
                              {status === 'next' && <span className={styles.statusNext}>Next</span>}
                              {status === 'past' && <span className={styles.statusPast}>Done</span>}
                              {status === 'upcoming' && <span className={styles.statusUpcoming}>Later</span>}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={showToday ? 5 : 4} className={styles.emptyCell}>
                        No classes scheduled for this day
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={styles.cardList}>
              {selectedStudent.timetable.length > 0 ? (
                selectedStudent.timetable.map((slot, idx) => {
                  const status = showToday ? getClassStatus(slot.timeStartRaw, slot.timeEndRaw) : 'upcoming';
                  return (
                    <div key={idx} className={`${styles.classCard} ${showToday ? styles[`card_${status}`] : ''}`}>
                      <div className={styles.classCardTop}>
                        <span className={styles.courseName}>{slot.course}</span>
                        {showToday && (
                          <>
                            {status === 'active' && <span className={styles.statusActive}>Now</span>}
                            {status === 'next' && <span className={styles.statusNext}>Next</span>}
                            {status === 'past' && <span className={styles.statusPast}>Done</span>}
                            {status === 'upcoming' && <span className={styles.statusUpcoming}>Later</span>}
                          </>
                        )}
                      </div>
                      <div className={styles.classCardBottom}>
                        <span className={styles.classCardTime}>{slot.time}</span>
                        <span className={styles.locationBadge}>{slot.location}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyCard}>No classes scheduled for this day</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>Made with ❤️ by Ajitesh (AI&DS)</p>
      </footer>
    </main>
  );
};

export default TimetablePage;