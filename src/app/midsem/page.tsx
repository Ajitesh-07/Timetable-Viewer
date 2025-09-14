'use client';
import React, { useEffect, useRef, useState } from "react";
import nameMap from '../../../lib/nameMap.json';
import styles from "./page.module.css";
import Head from "next/head";

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

async function getExamSchedule(selectedStudentInfo: { name: string; group: string, rollNo: string }): Promise<Student> {
    const res = await fetch(`midsem/api?idx=${selectedStudentInfo.rollNo.toUpperCase()}`);
    const data = await res.json()
    return {
        name: selectedStudentInfo.name,
        group: parseInt(selectedStudentInfo.group),
        rollno: selectedStudentInfo.rollNo,
        timetable: data.results
    }
}

const TimetablePage = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsVisible, setSuggestionsVisible] = useState<boolean>(false);

  const [selectedStudentInfo, setSelectedStudentInfo] = useState<{ name: string; group: string, rollNo: string } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (selectedStudentInfo) {

    getExamSchedule(selectedStudentInfo).then(data => {
        setSelectedStudent(data);
    });

    }
  }, [selectedStudentInfo]);

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
    setSearchQuery(studentName); // Set input text to the selected student
    const groupNo: string = nameMap[studentName as keyof typeof nameMap][0];
    const rollNo: string = nameMap[studentName as keyof typeof nameMap][1];
    setSelectedStudentInfo({ name: studentName, group: groupNo, rollNo: rollNo });
    setSuggestionsVisible(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0 && suggestions.length > 0) {
      setSuggestionsVisible(true);
    }
  };

  return (
    <>
      <Head>
        <title>Timetable finder</title>
        <meta name="description" content="This is the homepage of my awesome site" />
      </Head>

      <main>
        <div className={styles.pageContainer}>
          <main className={styles.mainContent}>
            <h1 className={styles.title}>Midsem Schedule Finder 🗓️</h1>
            <p className={styles.subtitle}>
              Enter a student name to view their Midsem Schedule.
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

            <div className={styles.downloadContainer}>
            {selectedStudent && (
              <div className={styles.timetableContainer}>
                <div className={styles.studentHeader}>
                    <div className={styles.studentHeaderC1}>
                        <h2 className={styles.studentName}>{selectedStudent.name}</h2>
                        <span className={styles.studentGroup}>
                            Group: {selectedStudent.group}
                        </span>

                    </div>
                    <div className={styles.studentHeaderRollNo}>
                        <span>Roll No: {selectedStudent.rollno}</span>
                    </div>
                  </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.timetable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Course</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.timetable.length > 0 ? (
                        selectedStudent.timetable.map((slot, idx) => (
                          <tr key={idx}>
                            <td>{slot.date}</td>
                            <td>{slot.day}</td>
                            <td>{slot.time}</td>
                            <td>{slot.course}</td>
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

        </div>
      </main>
    </>
  );
};

export default TimetablePage;