"use client"
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { initFirebase, db } from '../firebase_config/firebase';
import { collection, getDocs } from "firebase/firestore";

interface UserData {
    [key: string]: {
        [key: string]: string;
    };
}

interface ScheduleData {
    message: string;
    hybridSchedule: {
        [key: string]: {
            schedule: string;
            section: string;
        };
    };
    hybridScore: number;
    psoSchedule: {
        [key: string]: {
            schedule: string;
            section: string;
        };
    };
    psoScore: number;
}

export default function ScheduleGenerator() {
    const app = initFirebase();
    const auth = getAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [user, loading] = useAuthState(auth);
    const [userData, setUserData] = useState<UserData>({});
    const [error, setError] = useState<string | null>(null);
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);

    // Form fields
    const [fullName, setFullName] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [availableDay, setAvailableDay] = useState("");
    const [backSubjects, setBackSubjects] = useState("");
    const [semesterYear, setSemesterYear] = useState("");

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log("Fetching data for user:", "CNEtgkL70sMbsn6G9DAUFNXL0CJ3");
                const userCollection = collection(db, "CNEtgkL70sMbsn6G9DAUFNXL0CJ3");
                const userDataSnapshot = await getDocs(userCollection);

                const fetchedUserData: UserData = {};

                userDataSnapshot.forEach((doc) => {
                    fetchedUserData[doc.id] = {
                        ...doc.data() as { [key: string]: string },
                        documentName: doc.id
                    };
                });

                console.log("User data fetched from Firestore:", fetchedUserData);
                setUserData(fetchedUserData);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setError((error as Error).message);
            }
        };

  
            fetchUserData();

    }, [user]);

    const handleGenerateSchedule = async () => {
        try {
            const dataToSend = {
                userData: userData,
                fullName,
                yearLevel,
                semesterYear,
                availableDay: availableDay.split(',').map(day => day.trim()),
                backSubjects: backSubjects.split(',').map(subject => subject.trim())
            };

            console.log("Sending data to server:", dataToSend);

            const response = await fetch('http://127.0.0.1:5000/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Response from Flask backend:", result);
            setScheduleData(result);
        } catch (error) {
            console.error("Error sending data to Flask backend:", error);
            setError((error as Error).message);
        }
    };

    if (loading) {
        return(
            <main className = "w-screen h-screen flex justify-center items-center">
                <div>
                    <button type="button" className="text-center" disabled>
                        <svg className="animate-pulse h-10 w-28 mr-3" viewBox="0 0 24 24">
                        </svg>
                    Loading...
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="w-screen h-screen">
            <div className="w-full h-[10vh] bg-gradient-to-r from-cyan-700 via-blue-500 to-indigo-600 flex items-center shadow-md relative">
                <Link href="/" className = "ml-20 text-white">Home</Link>
            </div>

            <div className="w-screen h-[90vh] p-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Generate Schedule</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block mb-2">Full Name:</label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded p-2 w-full"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Year Level:</label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded p-2 w-full"
                                    value={yearLevel}
                                    onChange={(e) => setYearLevel(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Semester Year:</label>
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded p-2 w-full"
                                    placeholder="1"
                                    value={semesterYear}
                                    onChange={(e) => setSemesterYear(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Available Days (comma-separated):</label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded p-2 w-full"
                                    placeholder="Monday, Tuesday"
                                    value={availableDay}
                                    onChange={(e) => setAvailableDay(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Back Subjects (comma-separated):</label>
                                <input 
                                    type="text" 
                                    className="border border-gray-300 rounded p-2 w-full"
                                    placeholder="STAS111, UNDS111"
                                    value={backSubjects}
                                    onChange={(e) => setBackSubjects(e.target.value)}
                                />
                            </div>
                            <button 
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                onClick={handleGenerateSchedule}
                            > 
                                Generate Schedule 
                            </button>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Optimized Schedules</h2>
                        {scheduleData ? (
                            <div>
                                <p><strong>Message:</strong> {scheduleData.message}</p>
                                <h3 className="text-xl font-semibold mt-4 mb-2">Hybrid Schedule (Score: {scheduleData.hybridScore})</h3>
                                <ScheduleTable schedule={scheduleData.hybridSchedule} />
                                
                                <h3 className="text-xl font-semibold mt-6 mb-2">PSO Schedule (Score: {scheduleData.psoScore})</h3>
                                <ScheduleTable schedule={scheduleData.psoSchedule} />
                            </div>
                        ) : (
                            <p>No schedule generated yet. Fill out the form and click "Generate Schedule" to see results.</p>
                        )}
                    </div>
                </div>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
        </main>
    );
}

interface ScheduleTableProps {
    schedule: {
        [key: string]: {
            schedule: string;
            section: string;
        };
    } | null | undefined;
}

function ScheduleTable({ schedule }: ScheduleTableProps) {
    if (!schedule) {
        return <p>No schedule data available.</p>;
    }

    return (
        <table className="w-full border-collapse border border-gray-300 mb-20">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Subject</th>
                    <th className="border border-gray-300 p-2">Schedule</th>
                    <th className="border border-gray-300 p-2">Section</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(schedule).map(([subject, data]) => (
                    <tr key={subject}>
                        <td className="border border-gray-300 p-2">{subject}</td>
                        <td className="border border-gray-300 p-2">{data.schedule}</td>
                        <td className="border border-gray-300 p-2">{data.section}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}