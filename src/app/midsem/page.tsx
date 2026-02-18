'use client';
import React, { useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";
import SearchBar from "../components/SearchBar";

interface TimetableSlot {
  time: string;
  course: string;
  date: string;
  day: string;
  location: string;
}

interface Student {
  name: string;
  rollno: string;
  group: number;
  timetable: TimetableSlot[];
}

async function getExamSchedule(info: { name: string; group: string; rollNo: string }): Promise<Student> {
  const res = await fetch(`midsem/api?idx=${info.rollNo.toUpperCase()}`);
  const data = await res.json();
  return {
    name: info.name,
    group: parseInt(info.group),
    rollno: info.rollNo,
    timetable: data.results || [],
  };
}

const MidsemPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ name: string; group: string; rollNo: string } | null>(null);

  useEffect(() => {
    if (!selectedInfo) return;
    let mounted = true;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getExamSchedule(selectedInfo);
        if (mounted) setSelectedStudent(data);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        if (mounted) setSelectedStudent(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [selectedInfo]);

  const handleSelect = useCallback((name: string, group: string, rollNo: string) => {
    setSelectedInfo({ name, group, rollNo });
  }, []);

  // Calculate days until next exam
  const getCountdown = () => {
    if (!selectedStudent || selectedStudent.timetable.length === 0) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const slot of selectedStudent.timetable) {
      const [day, month, year] = slot.date.split('-').map(Number);
      const examDate = new Date(year, month - 1, day);
      examDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) return { days: diff, course: slot.course, date: slot.date };
    }
    return null;
  };

  const countdown = selectedStudent ? getCountdown() : null;

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Midsem Schedule
          <span className={styles.titleAccent}> Finder</span>
        </h1>
        <p className={styles.subtitle}>
          Search for a student to view their midsem exam schedule
        </p>
      </div>

      <div className={styles.searchArea}>
        <SearchBar
          placeholder="Search by student name..."
          onSelect={handleSelect}
        />
      </div>

      {(isLoading || selectedStudent) && (
        <div className={styles.resultArea}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <h2 className={styles.studentName}>
                  {selectedStudent?.name ?? selectedInfo?.name}
                </h2>
                <div className={styles.headerMeta}>
                  <span className={styles.badge}>Group {selectedStudent?.group ?? selectedInfo?.group}</span>
                  <span className={styles.badgeOutline}>{selectedStudent?.rollno ?? selectedInfo?.rollNo}</span>
                </div>
              </div>
              {countdown && (
                <div className={styles.countdown}>
                  <span className={styles.countdownNum}>{countdown.days}</span>
                  <span className={styles.countdownLabel}>
                    {countdown.days === 1 ? 'day' : 'days'} to {countdown.course}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className={styles.loadingCell}>
                        <div className={styles.spinner} />
                        Loading schedule...
                      </td>
                    </tr>
                  ) : selectedStudent && selectedStudent.timetable.length > 0 ? (
                    selectedStudent.timetable.map((slot, idx) => (
                      <tr key={idx}>
                        <td className={styles.dateCell}>{slot.date}</td>
                        <td>{slot.day}</td>
                        <td className={styles.timeCell}>{slot.time}</td>
                        <td><span className={styles.courseName}>{slot.course}</span></td>
                        <td><span className={styles.locationBadge}>{slot.location}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>No exams found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MidsemPage;