import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, Calendar, BookOpen, FileText, ClipboardList, 
  Settings, Bell, ChevronLeft, ChevronRight, PieChart, 
  Plus, Download, Upload, CheckCircle2, Circle, X, Trash2,
  AlertTriangle, BookPlus
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
};

const getDayString = (date) => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('home'); 
  const [navOpen, setNavOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: null, payload: null });
  const [editBooks, setEditBooks] = useState([]); // Local state for syllabus modal

  // Application Data State (In-Memory, Exportable)
  const [data, setData] = useState({
    reminders: [
      { id: 1, text: "Check Grade 10 Science assignments", done: false },
      { id: 2, text: "Staff meeting at 2 PM", done: false },
      { id: 3, text: "Prepare mid-term exam papers", done: false }
    ],
    grades: ["9D", "9S", "10", "11", "12", "13", "14"],
    gradeTerms: { "9D": 3, "9S": 3, "10": 3, "11": 2, "12": 3, "13": 3, "14": 2 },
    subjects: ["Math", "Science", "English", "History", "IT"],
    terms: {
      1: { start: '2026-01-01', end: '2026-04-10', totalLeaves: 0 },
      2: { start: '2026-05-01', end: '2026-08-15', totalLeaves: 0 },
      3: { start: '2026-09-01', end: '2026-12-10', totalLeaves: 0 }
    },
    activeTerm: 3,
    timetableConfig: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      periods: [
        { id: 'p1', start: '08:00', end: '08:40' },
        { id: 'p2', start: '08:40', end: '09:20' },
        { id: 'break1', start: '09:20', end: '09:40', isBreak: true, name: 'Interval' },
        { id: 'p3', start: '09:40', end: '10:20' },
        { id: 'p4', start: '10:20', end: '11:00' },
      ]
    },
    timetableSlots: {
      "Mon-p1": "Science-[10]",
      "Mon-p2": "Math-[9S]",
      "Tue-p3": "Science-[10]"
    },
    lessons: {
      "Science-[10]": { books: [{ id: 1, name: "Book 1", from: 1, to: 150 }], currentPages: 45, leaves: 2, attended: 18 },
      "Math-[9S]": { books: [{ id: 1, name: "Book 1", from: 1, to: 200 }], currentPages: 80, leaves: 1, attended: 22 }
    },
    exams: {
      "Science-[10]": [
        { id: 1, unit: 1, type: "MCQ", text: "What is the powerhouse of the cell?" }
      ]
    },
    marks: {}
  });

  // --- REAL-TIME CLOCK ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync modal state for books when opening EDIT_SYLLABUS
  useEffect(() => {
    if (modal.isOpen && modal.type === 'EDIT_SYLLABUS' && modal.payload?.subject) {
      const log = data.lessons[modal.payload.subject];
      setEditBooks(log?.books || [{ id: 1, name: "Book 1", from: 1, to: 100 }]);
    }
  }, [modal, data.lessons]);

  // --- DATA HANDLERS ---
  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "teacher_data_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setData(importedData);
        alert("Data imported successfully!");
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const getTotalPages = (subject) => {
    const log = data.lessons[subject];
    if (!log) return 100;
    if (log.books) return log.books.reduce((acc, b) => acc + Math.max(0, b.to - b.from + 1), 0);
    return log.totalPages || 100; // Fallback for old data format
  };

  // --- NAVIGATION MENU COMPONENT ---
  const NavigationMenu = () => {
    const navItems = [
      { id: 'home', icon: <Bell size={20} />, label: 'Reminders', angle: 0 },
      { id: 'timetable', icon: <Calendar size={20} />, label: 'Timetable', angle: 18 },
      { id: 'lessons', icon: <BookOpen size={20} />, label: 'Lesson Log', angle: 36 },
      { id: 'exams', icon: <FileText size={20} />, label: 'Exams', angle: 54 },
      { id: 'marks', icon: <ClipboardList size={20} />, label: 'Marks', angle: 72 },
      { id: 'settings', icon: <Settings size={20} />, label: 'Settings', angle: 90 },
    ];

    return (
      <div className="fixed top-4 left-4 z-50">
        <button 
          onClick={() => setNavOpen(!navOpen)}
          className={`w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${navOpen ? 'rotate-90' : ''}`}
        >
          {navOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {navItems.map((item, index) => {
          const radius = 100;
          const angleRad = (item.angle * Math.PI) / 180;
          const x = navOpen ? Math.cos(angleRad) * radius : 0;
          const y = navOpen ? Math.sin(angleRad) * radius : 0;

          return (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setNavOpen(false); }}
              className={`absolute top-2 left-2 w-10 h-10 bg-white text-indigo-700 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${currentView === item.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px) scale(${navOpen ? 1 : 0})`,
                opacity: navOpen ? 1 : 0,
                pointerEvents: navOpen ? 'auto' : 'none',
                transitionDelay: `${index * 30}ms`
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    );
  };

  // --- VIEWS ---

  // 1. HOME / DASHBOARD VIEW
  const HomeView = () => {
    const [newReminderText, setNewReminderText] = useState("");

    const addReminder = () => {
      if (!newReminderText.trim()) return;
      const newRems = [...data.reminders, { id: Date.now(), text: newReminderText, done: false }];
      updateData('reminders', newRems);
      setNewReminderText("");
    };

    const allRemindersDone = data.reminders.length > 0 && data.reminders.every(r => r.done);
    const currentDayStr = getDayString(currentTime);
    const currentTimeStr = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    let activePeriod = null;
    let activeSubject = null;

    if (data.timetableConfig.days.includes(currentDayStr)) {
      activePeriod = data.timetableConfig.periods.find(p => currentTimeStr >= p.start && currentTimeStr < p.end);
      if (activePeriod && !activePeriod.isBreak) {
        activeSubject = data.timetableSlots[`${currentDayStr}-${activePeriod.id}`];
      }
    }

    const todayDayStr = getDayString(selectedDate);
    const todayClasses = data.timetableConfig.periods.map(p => ({
      ...p,
      subject: data.timetableSlots[`${todayDayStr}-${p.id}`]
    })).filter(p => p.subject);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Reminders Box */}
        <div className={`bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg shadow-sm ${allRemindersDone ? 'opacity-70' : ''}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-orange-800 flex items-center"><Bell size={20} className="mr-2"/> Daily Reminders</h3>
            {allRemindersDone && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">All Done!</span>}
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {data.reminders.map(r => (
              <div key={r.id} className="flex items-center space-x-3 cursor-pointer group" 
                   onClick={() => {
                     const newRems = data.reminders.map(rem => rem.id === r.id ? {...rem, done: !rem.done} : rem);
                     updateData('reminders', newRems);
                   }}>
                {r.done ? <CheckCircle2 className="text-green-500 shrink-0" size={20} /> : <Circle className="text-gray-400 shrink-0 group-hover:text-indigo-400" size={20} />}
                <span className={`flex-1 ${r.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>{r.text}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateData('reminders', data.reminders.filter(rem => rem.id !== r.id));
                  }}
                  className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {data.reminders.length === 0 && <p className="text-sm text-gray-500 italic">No reminders set.</p>}
          </div>

          <div className="flex space-x-2 pt-2 border-t border-orange-200">
            <input 
              type="text" 
              value={newReminderText} 
              onChange={e => setNewReminderText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addReminder()}
              placeholder="Add a new reminder..." 
              className="flex-1 text-sm p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <button onClick={addReminder} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-orange-600 transition flex items-center">
              <Plus size={16} className="mr-1"/> Add
            </button>
          </div>
        </div>

        {/* Date Jumper */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d); }} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">{formatDate(selectedDate)}</h2>
            <button onClick={() => setSelectedDate(new Date())} className="text-indigo-600 text-sm font-semibold hover:underline mt-1">Jump to Today</button>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d); }} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
        </div>

        {/* Real-time Status Box */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Calendar size={100} />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-1 opacity-90">Live Status • {formatTime(currentTime)}</h2>
          
          {activePeriod ? (
            activePeriod.isBreak ? (
              <div className="mt-4">
                <h3 className="text-3xl font-bold">{activePeriod.name}</h3>
                <p className="opacity-90">{activePeriod.start} - {activePeriod.end}</p>
              </div>
            ) : (
              <div className="mt-4">
                <h3 className="text-3xl font-bold mb-2">{activeSubject || "Free Period"}</h3>
                <p className="opacity-90 text-lg mb-4">{activePeriod.start} - {activePeriod.end}</p>
                
                {activeSubject && data.lessons[activeSubject] && (
                  <div className="mb-6 bg-white/10 p-4 rounded-xl">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Term {data.activeTerm} Progress</span>
                      <span>{Math.round((data.lessons[activeSubject].currentPages / getTotalPages(activeSubject)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(data.lessons[activeSubject].currentPages / getTotalPages(activeSubject)) * 100}%` }}></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href="http://www.myinstitiue.com/attendance" target="_blank" rel="noreferrer" className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition">
                        Mark Attendance
                      </a>
                      <button onClick={() => setModal({ isOpen: true, type: 'LOG_PAGES', payload: { subject: activeSubject } })} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-800 transition">
                        Log Taught Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
             <div className="mt-4">
               <h3 className="text-2xl font-bold">No Active Classes</h3>
               <p className="opacity-90 mt-2">Enjoy your time or prepare for the next lesson!</p>
             </div>
          )}
        </div>

        {/* Today's Subjects List */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Schedule ({todayDayStr})</h3>
          {todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map((cls, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{cls.subject}</h4>
                    <p className="text-gray-500 text-sm">{cls.start} - {cls.end}</p>
                  </div>
                  {data.lessons[cls.subject] && (
                    <div className="w-1/3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{data.lessons[cls.subject].currentPages}/{getTotalPages(cls.subject)} pg</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(data.lessons[cls.subject].currentPages / getTotalPages(cls.subject)) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
              No classes scheduled for this day.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. TIMETABLE VIEW
  const TimetableView = () => {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Calendar className="mr-2 text-indigo-600"/> Timetable Editor</h2>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b-2 border-gray-200 text-gray-600 font-bold bg-gray-50">Time \ Day</th>
                {data.timetableConfig.days.map(day => (
                  <th key={day} className="p-3 border-b-2 border-gray-200 text-gray-600 font-bold bg-gray-50 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.timetableConfig.periods.map(period => (
                <tr key={period.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">{period.name || `Period`}</div>
                    <div className="text-xs text-gray-500">{period.start} - {period.end}</div>
                  </td>
                  {data.timetableConfig.days.map(day => {
                    const slotKey = `${day}-${period.id}`;
                    if (period.isBreak) {
                      return <td key={slotKey} className="p-3 text-center text-gray-400 bg-gray-50">Break</td>;
                    }
                    return (
                      <td key={slotKey} className="p-2">
                        <select 
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={data.timetableSlots[slotKey] || ""}
                          onChange={(e) => {
                            const newSlots = {...data.timetableSlots};
                            if (e.target.value) newSlots[slotKey] = e.target.value;
                            else delete newSlots[slotKey];
                            updateData('timetableSlots', newSlots);
                          }}
                        >
                          <option value="">-- Free --</option>
                          {data.grades.map(g => (
                            <optgroup key={g} label={`Grade ${g}`}>
                              {data.subjects.map(s => (
                                <option key={`${s}-[${g}]`} value={`${s}-[${g}]`}>{s}-[{g}]</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. LESSON LOG VIEW
  const LessonsView = () => {
    const activeSubjects = [...new Set(Object.values(data.timetableSlots))];

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center"><BookOpen className="mr-2 text-indigo-600"/> Lesson Progress</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-600">Active Term:</span>
            <select 
              className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm font-bold text-indigo-700"
              value={data.activeTerm}
              onChange={(e) => updateData('activeTerm', parseInt(e.target.value))}
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
              <option value={4}>Term 4</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {activeSubjects.map(subject => {
            const log = data.lessons[subject] || { currentPages: 0, attended: 0, leaves: 0 };
            const totalPg = getTotalPages(subject);
            const progress = (log.currentPages / totalPg) * 100 || 0;
            const totalPeriods = log.attended + log.leaves || 1;
            
            // Extract Grade and check Term Count Match
            const gradeMatch = subject.match(/-\[(.*?)\]/);
            const grade = gradeMatch ? gradeMatch[1] : null;
            const maxTerms = grade && data.gradeTerms[grade] ? data.gradeTerms[grade] : 3;
            const termWarning = data.activeTerm > maxTerms;

            return (
              <div key={subject} className={`bg-white p-5 rounded-2xl shadow-sm border ${termWarning ? 'border-red-300' : 'border-gray-100'} relative`}>
                {termWarning && (
                  <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl flex items-center">
                    <AlertTriangle size={12} className="mr-1"/> Grade {grade} only has {maxTerms} terms
                  </div>
                )}
                <div className="flex justify-between items-start mb-4 mt-2">
                  <h3 className="font-bold text-lg text-gray-800">{subject}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => setModal({ isOpen: true, type: 'MARK_LEAVE', payload: { subject } })} className="text-red-500 px-2 py-1 hover:bg-red-50 rounded text-xs font-bold border border-red-200 transition">Mark Leave</button>
                    <button onClick={() => setModal({ isOpen: true, type: 'EDIT_SYLLABUS', payload: { subject } })} className="text-indigo-600 px-2 py-1 hover:bg-indigo-50 rounded text-xs font-bold border border-indigo-200 transition">Edit Syllabus</button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Syllabus Pages (Taught / Total)</span>
                      <span className="font-mono">{log.currentPages} / {totalPg}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="flex space-x-2 text-sm">
                     <div className="flex-1 bg-green-50 text-green-700 p-2 rounded-lg text-center border border-green-100">
                        <span className="block font-bold text-lg">{Math.round((log.attended/totalPeriods)*100)}%</span>
                        Attendance
                     </div>
                     <div className="flex-1 bg-red-50 text-red-700 p-2 rounded-lg text-center border border-red-100">
                        <span className="block font-bold text-lg">{Math.round((log.leaves/totalPeriods)*100)}%</span>
                        Absent/Leave
                     </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  // 4. EXAM GENERATOR VIEW
  const ExamsView = () => {
    // Generate all available subjects based on settings
    const availableSubjectGrades = useMemo(() => {
      const list = [];
      data.subjects.forEach(s => {
        data.grades.forEach(g => {
          list.push(`${s}-[${g}]`);
        });
      });
      return list;
    }, [data.subjects, data.grades]);

    const [selectedSubject, setSelectedSubject] = useState(availableSubjectGrades[0] || "");
    const [newQ, setNewQ] = useState("");
    const [unit, setUnit] = useState(1);
    const [qType, setQType] = useState("MCQ");

    // Ensure selected subject is valid when list changes
    useEffect(() => {
      if (availableSubjectGrades.length > 0 && !availableSubjectGrades.includes(selectedSubject)) {
        setSelectedSubject(availableSubjectGrades[0]);
      }
    }, [availableSubjectGrades, selectedSubject]);

    const addQuestion = () => {
      if(!newQ.trim() || !selectedSubject) return;
      const currentExams = data.exams[selectedSubject] || [];
      const updatedExams = {
        ...data.exams,
        [selectedSubject]: [...currentExams, { id: Date.now(), unit, type: qType, text: newQ }]
      };
      updateData('exams', updatedExams);
      setNewQ("");
    };

    const generateExamFile = () => {
      if(!selectedSubject || !data.exams[selectedSubject] || data.exams[selectedSubject].length === 0) return alert("No questions to export.");
      const questions = data.exams[selectedSubject];
      let content = `EXAMINATION PAPER - ${selectedSubject}\nTerm: ${data.activeTerm}\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
      
      questions.forEach((q, i) => {
        content += `Q${i+1}. [${q.type}] (Unit ${q.unit}):\n${q.text}\n\n`;
      });

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedSubject}_Exam_Paper.txt`;
      link.click();
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><FileText className="mr-2 text-indigo-600"/> Exam Paper Generation</h2>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <select className="p-2 border border-gray-300 rounded-lg bg-white" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {availableSubjectGrades.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="p-2 border border-gray-300 rounded-lg bg-white" value={unit} onChange={e => setUnit(parseInt(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10].map(u => <option key={u} value={u}>Unit {u}</option>)}
            </select>
            <select className="p-2 border border-gray-300 rounded-lg bg-white" value={qType} onChange={e => setQType(e.target.value)}>
              <option value="MCQ">MCQ</option>
              <option value="Structured">Structured</option>
              <option value="Essay">Essay</option>
            </select>
          </div>
          
          <textarea 
            className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            rows="3"
            placeholder="Type your question here..."
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
          ></textarea>
          
          <div className="flex justify-between">
            <button onClick={addQuestion} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center shadow-sm">
              <Plus size={18} className="mr-1"/> Add Question
            </button>
            <button onClick={generateExamFile} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center shadow-sm">
              <Download size={18} className="mr-1"/> Generate Paper (.txt)
            </button>
          </div>
        </div>

        {/* Question Bank View */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <h3 className="font-bold text-lg mb-4 text-gray-700">Question Bank: {selectedSubject}</h3>
          <div className="space-y-3">
            {(!data.exams[selectedSubject] || data.exams[selectedSubject].length === 0) && (
              <p className="text-gray-500 text-sm italic">No questions added yet for {selectedSubject}.</p>
            )}
            {(data.exams[selectedSubject] || []).map((q, idx) => (
              <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-start shadow-sm">
                <div>
                  <div className="mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded mr-2">Unit {q.unit}</span>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded mr-2">{q.type}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{q.text}</p>
                </div>
                <button 
                  onClick={() => {
                    const newQs = data.exams[selectedSubject].filter(item => item.id !== q.id);
                    updateData('exams', { ...data.exams, [selectedSubject]: newQs });
                  }}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 5. MARKS VIEW
  const MarksView = () => {
    const activeSubjects = [...new Set(Object.values(data.timetableSlots))];
    const [selectedSubject, setSelectedSubject] = useState(activeSubjects[0] || "");
    const [bulkText, setBulkText] = useState("");
    const [parseResult, setParseResult] = useState(null);

    const handleParse = () => {
      const lines = bulkText.split('\n');
      const results = [];
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/); 
        if(parts.length >= 2) {
          const index = parts[0];
          const marks = parts.slice(1).join(' '); 
          results.push({ index, marks });
        }
      });
      setParseResult(results);
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><ClipboardList className="mr-2 text-indigo-600"/> Additional Marks & Activities</h2>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Subject</label>
            <select className="w-full p-2 border border-gray-300 rounded-lg bg-white" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {activeSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <p className="text-sm text-gray-500 mb-2">Paste bulk marks here (Format: <code>Index Marks</code> per line. e.g. <code>1001 85</code> or <code>1002 absent</code>)</p>
          <textarea 
            className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 font-mono text-sm h-40"
            placeholder="1001 85&#10;1002 92&#10;1003 ab"
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
          ></textarea>

          <button onClick={handleParse} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 w-full mb-6 shadow-sm">
            Process Marks
          </button>

          {parseResult && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-bold text-lg mb-2 text-green-600">Processed Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {parseResult.map((res, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded border flex justify-between text-sm">
                    <span className="font-mono font-bold text-gray-600">{res.index}</span>
                    <span className={`font-bold ${isNaN(res.marks) ? 'text-red-500' : 'text-indigo-600'}`}>{res.marks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 6. SETTINGS VIEW
  const SettingsView = () => {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Settings className="mr-2 text-gray-600"/> Settings & Data</h2>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          {/* Subjects & Grades Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Subjects & Grades</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Taught Subjects (Comma separated)</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={data.subjects.join(', ')}
                onChange={(e) => updateData('subjects', e.target.value.split(',').map(s => s.trim()).filter(s=>s))}
                placeholder="e.g. Math, Science, English"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Managed Grades (Comma separated)</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={data.grades.join(', ')}
                onChange={(e) => {
                  const newGrades = e.target.value.split(',').map(s => s.trim()).filter(s=>s);
                  // Initialize terms for any new grade to default 3
                  const newGradeTerms = { ...data.gradeTerms };
                  newGrades.forEach(g => { if(!newGradeTerms[g]) newGradeTerms[g] = 3; });
                  setData(prev => ({ ...prev, grades: newGrades, gradeTerms: newGradeTerms }));
                }}
                placeholder="e.g. 9D, 9S, 10, 11, 14"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-3">Terms Count per Grade</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {data.grades.map(g => (
                  <div key={g} className="flex items-center space-x-2 bg-white p-2 border border-gray-300 rounded-lg shadow-sm">
                    <span className="font-bold text-sm text-gray-600 w-8">{g}</span>
                    <input 
                      type="number" 
                      value={data.gradeTerms[g] || 3} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if(val > 0 && val <= 4) {
                          updateData('gradeTerms', { ...data.gradeTerms, [g]: val });
                        }
                      }} 
                      className="w-12 p-1 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500" 
                      min="1" max="4" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Timetable Configuration Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Timetable Configuration</h3>
            <div className="space-y-3 mb-4">
              {data.timetableConfig.periods.map((p, idx) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input 
                    type="text" 
                    value={p.name || ''} 
                    onChange={(e) => {
                      const newPeriods = [...data.timetableConfig.periods];
                      newPeriods[idx].name = e.target.value;
                      updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm" 
                    placeholder={`Period ${idx + 1} Name`}
                  />
                  <div className="flex space-x-2">
                    <input 
                      type="time" 
                      value={p.start} 
                      onChange={(e) => {
                        const newPeriods = [...data.timetableConfig.periods];
                        newPeriods[idx].start = e.target.value;
                        updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
                      }}
                      className="w-24 p-2 border border-gray-300 rounded text-sm bg-white"
                    />
                    <input 
                      type="time" 
                      value={p.end} 
                      onChange={(e) => {
                        const newPeriods = [...data.timetableConfig.periods];
                        newPeriods[idx].end = e.target.value;
                        updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
                      }}
                      className="w-24 p-2 border border-gray-300 rounded text-sm bg-white"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full md:w-auto">
                    <label className="flex items-center text-sm font-bold text-gray-600 bg-white px-2 py-1 rounded border">
                      <input 
                        type="checkbox" 
                        checked={p.isBreak || false} 
                        onChange={(e) => {
                          const newPeriods = [...data.timetableConfig.periods];
                          newPeriods[idx].isBreak = e.target.checked;
                          updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
                        }}
                        className="mr-2 w-4 h-4 text-indigo-600 rounded"
                      /> Break
                    </label>
                    <button 
                      onClick={() => {
                        const newPeriods = data.timetableConfig.periods.filter((_, i) => i !== idx);
                        updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
                      }}
                      className="text-red-500 p-2 hover:bg-red-100 rounded ml-2 transition"
                    ><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                const newPeriods = [...data.timetableConfig.periods, { id: `p${Date.now()}`, start: '12:00', end: '12:40', isBreak: false, name: '' }];
                updateData('timetableConfig', { ...data.timetableConfig, periods: newPeriods });
              }}
              className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-100 transition shadow-sm w-full md:w-auto"
            >
              + Add Period / Break
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Import / Export */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Backup & Restore</h3>
            <p className="text-sm text-gray-500 mb-4">Export your term data, exams, and timetable to a file to use across devices or keep as backup.</p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={exportData} className="flex-1 bg-indigo-600 text-white border border-indigo-700 px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center transition shadow-sm">
                <Download className="mr-2"/> Export Data (.json)
              </button>
              
              <label className="flex-1 bg-white text-gray-800 border border-gray-300 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center cursor-pointer transition shadow-sm">
                <Upload className="mr-2"/> Import Data
                <input type="file" accept=".json" className="hidden" onChange={importData} />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20">
      <NavigationMenu />
      
      {/* Top Header Spacing to account for absolute Nav Menu */}
      <div className="h-20 bg-indigo-600 rounded-b-[3rem] shadow-md flex items-center justify-center relative">
         <h1 className="text-white font-bold text-xl tracking-wide absolute bottom-4">Teacher Companion</h1>
      </div>

      <div className="p-4 md:p-8 pt-6">
        {currentView === 'home' && <HomeView />}
        {currentView === 'timetable' && <TimetableView />}
        {currentView === 'lessons' && <LessonsView />}
        {currentView === 'exams' && <ExamsView />}
        {currentView === 'marks' && <MarksView />}
        {currentView === 'settings' && <SettingsView />}
      </div>

      {/* MODALS OVERLAY */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl transform transition-all">
            
            {/* Modal: Log Taught Pages */}
            {modal.type === 'LOG_PAGES' && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Log Taught Pages</h3>
                <p className="text-sm text-gray-600 mb-6">How many pages did you teach today for <strong>{modal.payload.subject}</strong>?</p>
                <input type="number" id="pageCountInput" className="w-full p-4 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 font-bold text-lg" placeholder="e.g. 5" autoFocus />
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setModal({isOpen:false})} className="px-5 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                  <button onClick={() => {
                    const val = parseInt(document.getElementById('pageCountInput').value);
                    if(val) {
                      const subjLog = data.lessons[modal.payload.subject] || { currentPages: 0, attended: 0, leaves: 0 };
                      updateData('lessons', {
                        ...data.lessons,
                        [modal.payload.subject]: { ...subjLog, currentPages: subjLog.currentPages + val, attended: subjLog.attended + 1 }
                      });
                      setModal({isOpen:false});
                    }
                  }} className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition">Save Progress</button>
                </div>
              </>
            )}

            {/* Modal: Edit Syllabus Pages (Books setup) */}
            {modal.type === 'EDIT_SYLLABUS' && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Syllabus Books Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">Set up the syllabus pages for <strong>{modal.payload.subject}</strong>. You can add multiple books if necessary.</p>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-64 overflow-y-auto mb-4 space-y-3">
                  {editBooks.map((book, idx) => (
                    <div key={book.id} className="flex flex-wrap md:flex-nowrap space-y-2 md:space-y-0 space-x-0 md:space-x-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                       <input 
                         value={book.name} 
                         onChange={e => { const nb=[...editBooks]; nb[idx].name=e.target.value; setEditBooks(nb); }} 
                         className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg text-sm font-bold" 
                         placeholder="Book Name"
                       />
                       <div className="flex w-full md:w-2/3 space-x-2">
                         <div className="flex-1 flex items-center space-x-1 border border-gray-300 rounded-lg px-2">
                           <span className="text-xs text-gray-400">From</span>
                           <input 
                             type="number" 
                             value={book.from} 
                             onChange={e => { const nb=[...editBooks]; nb[idx].from=parseInt(e.target.value); setEditBooks(nb); }} 
                             className="w-full p-2 outline-none text-sm font-mono" 
                             min="1"
                           />
                         </div>
                         <div className="flex-1 flex items-center space-x-1 border border-gray-300 rounded-lg px-2">
                           <span className="text-xs text-gray-400">To</span>
                           <input 
                             type="number" 
                             value={book.to} 
                             onChange={e => { const nb=[...editBooks]; nb[idx].to=parseInt(e.target.value); setEditBooks(nb); }} 
                             className="w-full p-2 outline-none text-sm font-mono" 
                             min="1"
                           />
                         </div>
                         <button 
                           onClick={() => setEditBooks(editBooks.filter(b => b.id !== book.id))} 
                           className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                         >
                           <Trash2 size={18}/>
                         </button>
                       </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setEditBooks([...editBooks, { id: Date.now(), name: `Book ${editBooks.length + 1}`, from: 1, to: 100 }])} 
                    className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 py-3 rounded-lg font-bold text-sm hover:bg-indigo-50 transition flex justify-center items-center"
                  >
                    <BookPlus size={18} className="mr-2"/> Add Another Book
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold text-gray-600">
                    Total Pages: <span className="text-indigo-600 text-lg font-mono">{editBooks.reduce((acc, b) => acc + Math.max(0, b.to - b.from + 1), 0)}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setModal({isOpen:false})} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancel</button>
                    <button onClick={() => {
                      const subjLog = data.lessons[modal.payload.subject] || { currentPages: 0, attended: 0, leaves: 0 };
                      updateData('lessons', {
                        ...data.lessons,
                        [modal.payload.subject]: { ...subjLog, books: editBooks }
                      });
                      setModal({isOpen:false});
                    }} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition">Save Books</button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Mark Leave */}
            {modal.type === 'MARK_LEAVE' && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center"><Circle className="text-red-500 mr-3 fill-red-100" size={28}/> Mark Leave</h3>
                <p className="mb-8 text-gray-600">Are you sure you want to log an absence/leave for your <strong>{modal.payload.subject}</strong> period? This will decrease your overall attendance percentage for this class.</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setModal({isOpen:false})} className="px-5 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                  <button onClick={() => {
                      const subjLog = data.lessons[modal.payload.subject] || { currentPages: 0, attended: 0, leaves: 0 };
                      updateData('lessons', {
                        ...data.lessons,
                        [modal.payload.subject]: { ...subjLog, leaves: subjLog.leaves + 1 }
                      });
                      setModal({isOpen:false});
                  }} className="px-5 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md transition">Confirm Leave</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}