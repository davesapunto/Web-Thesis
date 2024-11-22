"use client";
import { initFirebase } from './firebase_config/firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import React from 'react';
import Link from "next/link";

type ButtonsByYearSemester = {
  [key: string]: string[];
};

type CourseSchedule = {
  [course: string]: {
    day: string;
    timeRange: string;
  };
};

type SectionSchedules = {
  [section: string]: CourseSchedule;
};

export default function Generator() {
  const app = initFirebase();
  const auth = getAuth();
  const db = getFirestore(app);
  const [user, loading] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSemester, setSelectedSemester] = useState<string>("1st Sem");
  const [buttonsByYearSemester, setButtonsByYearSemester] = useState<ButtonsByYearSemester>({});
  const [sectionSchedules, setSectionSchedules] = useState<SectionSchedules>({});
  const [activeSection, setActiveSection] = useState<string>("YA-1");
  const [warning, setWarning] = useState<string | null>(null);

  const courseData: { [key: string]: string[] } = {
    '1-1st Sem': ['UNDS111', 'STAS111', 'TCWD111', 'ENGL111', 'VRTS111', 'FOPR111', 'ICOM111', 'PCAS111'],
    '1-2nd Sem': ['PURC111', 'MATM111', 'RIPH111', 'CRWT111', 'VRTS112', 'INPR111', 'WBDV111', 'DLOG111'],
    '1-Summer': ['NSTP111', 'NSTP112', 'PHED111', 'PHED112'],
    '2-1st Sem': ['ETIC211', 'PHED213', 'DSAA211', 'IMGT211', 'WBDV112', 'DSCR211', 'OOPR211', 'VRTS113', 'VRTS114'],
    '2-2nd Sem': ['PPGC211', 'PHED214', 'LFAD211', 'ADET211', 'DBSA211', 'MADS211', 'QMET211', 'OOPR212'],
    '3-1st Sem': ['SEPC311', 'ITPM311', 'HCIN311', 'IAAS311', 'IPTC311', 'NETW311', 'SIAA311', 'SFCR311'],
    '3-2nd Sem': ['HCIN312', 'IAAS312', 'IPTC312', 'NETW312', 'SIAA312', 'ITCP311'],
    '4-1st Sem': ['CTIC411', 'BUSM311', 'ITCP312', 'ITEL311', 'ITEL312', 'SADM411', 'ARTA111', 'RIZL111'],
    '4-2nd Sem': ['ITM411', 'ITEL313', 'ITEL314'],
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (user) {
      loadScheduleFromFirestore();
    }
  }, [user, selectedYear, selectedSemester, activeSection]);

  const loadScheduleFromFirestore = async () => {
    if (!user) return;

    const docRef = doc(db, `${user.uid}`, `${selectedYear}_${selectedSemester}_${activeSection}`);
    const docSnap = await getDoc(docRef);

    console.log("Fetched data from Firestore:", docSnap.data()); // Debug log

    if (docSnap.exists()) {
      const data = docSnap.data();
      const formattedData: CourseSchedule = {};
      Object.entries(data).forEach(([course, value]) => {
        if (typeof value === 'string') {
          const [day, timeRange] = value.split(' | ');
          formattedData[course] = { day, timeRange };
        }
      });
      console.log("Formatted data:", formattedData); // Debug log
      setSectionSchedules(prevSchedules => {
        const newSchedules = {
          ...prevSchedules,
          [activeSection]: formattedData
        };
        console.log("Updated section schedules:", newSchedules); // Debug log
        return newSchedules;
      });
    } else {
      console.log("No data found in Firestore"); // Debug log
      setSectionSchedules(prevSchedules => ({
        ...prevSchedules,
        [activeSection]: {}
      }));
    }
  };

  const saveScheduleToFirestore = async () => {
    if (!user) return;

    const key = `${selectedYear}-${selectedSemester}`;
    const courses = courseData[key] || [];
    const currentSchedule = sectionSchedules[activeSection] || {};

    // Check if all courses have a schedule
    const unscheduledCourses = courses.filter(course => !currentSchedule[course] || !currentSchedule[course].day || !currentSchedule[course].timeRange);

    if (unscheduledCourses.length > 0) {
      setWarning(`Warning: The following courses have no schedule: ${unscheduledCourses.join(', ')}`);
      return;
    }

    setWarning(null);
    const docRef = doc(db, `${user.uid}`, `${selectedYear}_${selectedSemester}_${activeSection}`);
    const dataToSave = Object.fromEntries(
      Object.entries(currentSchedule).map(([course, { day, timeRange }]) => [course, `${day} | ${timeRange}`])
    );
    await setDoc(docRef, dataToSave);
    alert("Schedule saved successfully!");
  };

  const handleInputChange = (course: string, day: string, timeRange: string) => {
    setSectionSchedules(prevSchedules => {
      const currentSchedule = { ...prevSchedules[activeSection] } || {};
      
      // If the course already has a schedule on a different day, remove it
      if (currentSchedule[course] && currentSchedule[course].day !== day) {
        delete currentSchedule[course];
      }

      // If the new time range is not empty, update the schedule
      if (timeRange.trim() !== '') {
        currentSchedule[course] = { day, timeRange };
      } else if (currentSchedule[course] && currentSchedule[course].day === day) {
        // If the new time range is empty and it's the same day as the current schedule, remove the schedule
        delete currentSchedule[course];
      }

      return {
        ...prevSchedules,
        [activeSection]: currentSchedule
      };
    });
  }
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSemesterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemester(event.target.value);
  };

  const handleAddSection = () => {
    const key = `${selectedYear}-${selectedSemester}`;
    setButtonsByYearSemester(prevState => {
      const existingButtons = prevState[key] || [];
      if (existingButtons.length < 10) {
        const newSection = `YA-${existingButtons.length + 1}`;
        return {
          ...prevState,
          [key]: [...existingButtons, newSection]
        };
      }
      return prevState;
    });
  };

  const renderButtonsForCurrentSelection = () => {
    const key = `${selectedYear}-${selectedSemester}`;
    return buttonsByYearSemester[key] || [];
  };

  const renderTable = () => {
    const key = `${selectedYear}-${selectedSemester}`;
    const courses = courseData[key] || [];
    const currentSchedule = sectionSchedules[activeSection] || {};

    return (
      <div className="grid grid-cols-7 w-[100rem] h-[52.5rem]">
        <div className="border border-black w-[14rem] h-[50rem] flex flex-col items-center mt-10">
          <button
            onClick={handleAddSection}
            className="border border-black h-10 flex items-center rounded-lg hover:bg-gray-300 justify-center w-36"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Section
          </button>
          {renderButtonsForCurrentSelection().map((button: string) => (
            <button 
              key={button} 
              className={`border border-black h-10 flex items-center rounded-lg hover:bg-gray-300 justify-center w-36 mt-4 ${activeSection === button ? 'bg-blue-500 text-white' : ''}`}
              onClick={() => setActiveSection(button)}
            >
              {button}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-8 border border-black w-[84rem] h-[50rem] mt-10">
          <div className="w-36 h-10 border border-black rounded-lg flex items-center justify-center">Code</div>
          {days.map(day => (
            <div key={day} className="w-36 h-10 border border-black rounded-lg flex items-center justify-center">{day}</div>
          ))}

           {/* Course Rows */}
           {courses.map((course) => (
            <React.Fragment key={course}>
              <div className="w-36 h-10 border border-black flex items-center justify-center">{course}</div>
              {days.map(day => {
                const scheduleForCourse = currentSchedule[course] || { day: '', timeRange: '' };
                const isThisDay = scheduleForCourse.day === day;
                console.log(`Rendering input for ${course} on ${day}:`, scheduleForCourse); // Debug log
                return (
                  <input 
                    key={`${course}-${day}`}
                    type="text" 
                    className="w-36 h-10 border border-black flex items-center justify-center"
                    value={isThisDay ? scheduleForCourse.timeRange : ''}
                    onChange={(e) => handleInputChange(course, day, e.target.value)}
                    placeholder="e.g. 7:00 - 10:00"
                    disabled={!isThisDay && scheduleForCourse.day !== ''}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <main className = "w-screen h-screen bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500">
        <div className = "w-screen h-screen flex items-center">
          <div className = "mb-20 ml-20">
            <h1 className = "animate-typing overflow-hidden whitespace-nowrap border-r-4 border-r-white pr-5 text-5xl text-white font-bold">Welcome, This is our Thesis Project.</h1>
            <h1 className = "text-2xl mt-10">Schedule Generator for IT Students in Our Lady of Fatima University - Lagro</h1>
            <Link href = "/generator"><button className = "border border-1 border-black mt-10 h-20 w-96 text-xl text-center">Click Here to Proceed</button></Link>
          </div>
        </div>
      </main>  
    );
  } else if (user) {
    return (
      <main className="w-screen h-screen">
        <div className="w-full h-[10vh] bg-[#8785A2] flex items-center shadow-md relative">
          <Link href="/generator" className="ml-8">Schedule Generator</Link>
          <button
            type="button"
            className="ml-auto mr-10 inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            id="menu-button"
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={toggleDropdown}
          >
            Welcome, {user?.displayName || "User"}
            <svg className="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          {isOpen && (
            <div
              className="absolute right-0 z-10 mt-[6rem] mr-16 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700"
                  role="menuitem"
                  tabIndex={-1}
                  id="menu-item-3"
                  onClick={() => auth.signOut()}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-screen h-[110vh] bg-white flex justify-center items-center ">
          <div className="flex flex-col items-center justify-center gap-y-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg p-2"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>

            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="border border-gray-300 rounded-lg p-2"
            >
              <option value="1st Sem">1st Sem</option>
              <option value="2nd Sem">2nd Sem</option>
              <option value="Summer">Summer</option>
            </select>

            {renderTable()}
            {warning && (
              <div className="mt-4 text-red-500 font-bold">
                {warning}
              </div>
            )}
            <button
              onClick={saveScheduleToFirestore}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save Schedule
            </button>
          </div>
        </div>
      </main>
    );
  }
}