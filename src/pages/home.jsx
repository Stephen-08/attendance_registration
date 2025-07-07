// src/pages/home.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarLayout from '../pages/SidebarLayout';
import { Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import './home.css';

const Home = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
const [modalTitle, setModalTitle] = useState('');
const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    onTime: 0,
    absent: 0,
    lateArrival: 0,
    earlyDepartures: 0,
    timeOff: 0
  });
const closeModal = () => {
  setModalVisible(false);
};
  const username =
  location.state?.username ||
  localStorage.getItem("username") ||
  "Admin";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:5000/api/attendance?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setAttendanceData(data);
      calculateStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData(); // initial load

  const StatCard = ({ icon: Icon, title, value, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="stat-card-content">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon"><Icon /></div>
    </div>
  </div>
);


  const refreshHandler = () => fetchData(); // refetch on event
  window.addEventListener("attendance-updated", refreshHandler);

  return () => window.removeEventListener("attendance-updated", refreshHandler);
}, [selectedDate]);

  const calculateStats = (data) => {
    setStats({
      totalEmployees: data.length,
      onTime: data.filter(d => d.status === 'Present').length,
      absent: data.filter(d => d.status === 'Absent').length,
      lateArrival: data.filter(d => d.status === 'Late').length,
      earlyDepartures: data.filter(d => d.status === 'Early Departure').length,
      timeOff: data.filter(d => d.status === 'On Leave').length,
    });
  };

  const formatTime = date => date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatTableDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatTimeForTable = (timeString) => {
    if (!timeString || timeString === 'RUNE') return '--';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut || checkIn === 'RUNE' || checkOut === 'RUNE') return '--';
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    const start = h1 * 60 + m1;
    const end = h2 * 60 + m2;
    const diff = end - start;
    if (diff <= 0) return '--';
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  };

  const handleStatCardClick = (status, title) => {
  const filtered = attendanceData.filter(d => d.status === status);
  setFilteredEmployees(filtered);
  setModalTitle(title);
  setModalVisible(true);
};


  return (
    <SidebarLayout currentTime={currentTime} username={username}>
      <div className="stats-grid">
        <StatCard icon={UserX} title="Absent" value={stats.absent} onClick={() => handleStatCardClick('Absent', 'Absent Employees')} />
<StatCard icon={UserCheck} title="On Time" value={stats.onTime} onClick={() => handleStatCardClick('Present', 'On Time Employees')} />
<StatCard icon={Clock} title="Late Arrival" value={stats.lateArrival} onClick={() => handleStatCardClick('Late', 'Late Arrivals')} />
<StatCard icon={Users} title="Early Departures" value={stats.earlyDepartures} onClick={() => handleStatCardClick('Early Departure', 'Early Departures')} />
<StatCard icon={Calendar} title="Time-off" value={stats.timeOff} onClick={() => handleStatCardClick('On Leave', 'On Leave Employees')} />

      </div>

      <div className="table-container">
        {modalVisible && (
  <div className="modal-overlay" onClick={closeModal}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{modalTitle}</h3>
        <button className="close-btn" onClick={closeModal}>✕</button>
      </div>
      <div className="modal-body">
        {filteredEmployees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <ul className="employee-list">
            {filteredEmployees.map(emp => (
              <li key={emp.attendance_id}>
                <strong>{emp.employee_id}</strong> - {emp.emp_name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
)}

        <div className="table-header">
  <h3 className="table-title">
    Attendance Overview
    <span className="employee-count">({stats.totalEmployees} Employees)</span>
  </h3>

          <div className="table-actions">
            <input
    type="text"
    placeholder="🔍 Search employee..."
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    className="search-input-small"
  />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Current Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Work Hours</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="8">{error}</td></tr>
              ) : attendanceData.length === 0 ? (
                <tr><td colSpan="8">No data found for {formatTableDate(selectedDate)}</td></tr>
              ) : (
                attendanceData
  .filter((e) =>
    e.emp_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .map((e) => (
    <tr key={e.attendance_id}>
      <td>{e.employee_id}</td>
      <td>{e.emp_name}</td>
      <td>{e.current_location || '--'}</td>
      <td>{formatTableDate(e.date)}</td>
      <td>
        <span className={`status-badge ${e.status.toLowerCase().replace(' ', '-')}`}>
          {e.status}
        </span>
      </td>
      <td>{formatTimeForTable(e.check_in)}</td>
      <td>{formatTimeForTable(e.check_out)}</td>
      <td>{calculateWorkHours(e.check_in, e.check_out)}</td>
    </tr>
  ))

              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
};

const StatCard = ({ icon: Icon, title, value, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <div className="stat-card-content">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon"><Icon /></div>
    </div>
  </div>
);


export default Home;
