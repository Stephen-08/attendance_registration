// src/pages/home.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarLayout from '../pages/SidebarLayout';
import { Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import './home.css';

const StatCard = ({ icon: Icon, title, value, onClick }) => (
  <div className="stat-card" onClick={onClick}>
    <div className="stat-card-content">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon"><Icon /></div>
    </div>
  </div>
);

const Home = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState({
    attendance_id: '',
    employee_name: '',
    employee_id: '',
    current_location: '',
    status: '',
    check_in_hour: '',
    check_in_minute: '',
    check_in_ampm: 'AM',
    check_out_hour: '',
    check_out_minute: '',
    check_out_ampm: 'AM'
  });

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [newEmp, setNewEmp] = useState({
    employee_id:'',
    name: '',
    email: '',
    phone_no: '',
    position: '',
    permanent_location: '',
  });

  const [editEmp, setEditEmp] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone_no: '',
    position: '',
    permanent_location: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [removeId, setRemoveId] = useState('');

  const [stats, setStats] = useState({
    totalEmployees: 0,
    onTime: 0,
    absent: 0,
    lateArrival: 0,
    timeOff: 0
  });

  const username =
    location.state?.username ||
    localStorage.getItem("username") ||
    "Admin";

  const getCurrentDateString = () => {
    return new Date().toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatSelectedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`https://attendancebackend.duckdns.org/api/attendance?date=${selectedDate}`);

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

    fetchData();

    const refreshHandler = () => fetchData();
    window.addEventListener("attendance-updated", refreshHandler);
    return () => window.removeEventListener("attendance-updated", refreshHandler);
  }, [selectedDate]);

  const calculateStats = (data) => {
    setStats({
      totalEmployees: data.length,
      onTime: data.filter(d => d.status === 'Present').length,
      absent: data.filter(d => d.status === 'Absent').length,
      lateArrival: data.filter(d => d.status === 'Late').length,
      timeOff: data.filter(d => d.status === 'On Leave').length,
    });
  };

  const formatTableDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

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
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
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

  const closeModal = () => setModalVisible(false);

  const openUpdateModal = (record) => {
    let checkInHour = '', checkInMinute = '', checkInAmpm = 'AM';
    if (record.check_in && record.check_in !== 'RUNE') {
      const [hours, minutes] = record.check_in.split(':');
      let hour = parseInt(hours, 10);
      checkInAmpm = hour >= 12 ? 'PM' : 'AM';
      checkInHour = (hour % 12 || 12).toString();
      checkInMinute = minutes;
    }

    let checkOutHour = '', checkOutMinute = '', checkOutAmpm = 'AM';
    if (record.check_out && record.check_out !== 'RUNE') {
      const [hours, minutes] = record.check_out.split(':');
      let hour = parseInt(hours, 10);
      checkOutAmpm = hour >= 12 ? 'PM' : 'AM';
      checkOutHour = (hour % 12 || 12).toString();
      checkOutMinute = minutes;
    }

    setUpdateData({
      attendance_id: record.attendance_id,
      employee_name: record.emp_name,
      employee_id: record.employee_id,
      current_location: record.current_location || '',
      status: record.status || '',
      check_in_hour: checkInHour,
      check_in_minute: checkInMinute,
      check_in_ampm: checkInAmpm,
      check_out_hour: checkOutHour,
      check_out_minute: checkOutMinute,
      check_out_ampm: checkOutAmpm
    });
    setUpdateModalVisible(true);
  };

  const closeUpdateModal = () => setUpdateModalVisible(false);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    let checkIn = null;
    if (updateData.check_in_hour && updateData.check_in_minute) {
      let hour = parseInt(updateData.check_in_hour);
      const minute = updateData.check_in_minute.toString().padStart(2, '0');
      
      if (updateData.check_in_ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (updateData.check_in_ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      checkIn = `${hour.toString().padStart(2, '0')}:${minute}:00`;
    }
    
    let checkOut = null;
    if (updateData.check_out_hour && updateData.check_out_minute) {
      let hour = parseInt(updateData.check_out_hour);
      const minute = updateData.check_out_minute.toString().padStart(2, '0');
      
      if (updateData.check_out_ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (updateData.check_out_ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      checkOut = `${hour.toString().padStart(2, '0')}:${minute}:00`;
    }

    try {
      const payload = {
        attendance_id: updateData.attendance_id,
        current_location: updateData.current_location,
        status: updateData.status,
        check_in: checkIn,
        check_out: checkOut
      };

      const res = await fetch('https://attendancebackend.duckdns.org/api/update_attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      alert('Attendance updated successfully!');
      closeUpdateModal();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      console.error(err);
      alert('Error updating attendance: ' + err.message);
    }
  };

  // Add employee handlers
  const openAddModal = () => {
    setNewEmp({employee_id: '', name: '', email: '', phone_no: '', position: '', permanent_location: '' });
    setPhotoFile(null);
    setAddModalVisible(true);
  };
  const closeAddModal = () => setAddModalVisible(false);

  const onPhotoChange = (e) => {
    setPhotoFile(e.target.files?.[0] || null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.employee_id) {
      alert('Please enter name and employee id');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employee_id:newEmp.employee_id,
        name: newEmp.name,
        email: newEmp.email,
        phone_no: newEmp.phone_no,
        position: newEmp.position,
        permanent_location: newEmp.permanent_location,
      };

      const res = await fetch('https://attendancebackend.duckdns.org/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to add employee');
      }

      alert('Employee added successfully.');
      closeAddModal();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      console.error(err);
      alert('Error adding employee: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Edit employee handlers
  const openEditModal = () => {
    setEditEmp({ employee_id: '', name: '', email: '', phone_no: '', position: '', permanent_location: '' });
    setEditModalVisible(true);
  };
  const closeEditModal = () => setEditModalVisible(false);

  const handleLoadEmployee = async () => {
    if (!editEmp.employee_id) {
      alert('Please enter employee ID first');
      return;
    }

    try {
      const res = await fetch(`https://attendancebackend.duckdns.org/api/employees/${encodeURIComponent(editEmp.employee_id)}`);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Employee not found');
      }

      setEditEmp({
        employee_id: data.employee.employee_id,
        name: data.employee.name || '',
        email: data.employee.email || '',
        phone_no: data.employee.phone_no || '',
        position: data.employee.position || '',
        permanent_location: data.employee.permanent_location || '',
      });
      alert('Employee details loaded');
    } catch (err) {
      console.error(err);
      alert('Error loading employee: ' + (err.message || err));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editEmp.employee_id) {
      alert('Please enter employee ID');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employee_id: editEmp.employee_id,
        name: editEmp.name || null,
        email: editEmp.email || null,
        phone_no: editEmp.phone_no || null,
        position: editEmp.position || null,
        permanent_location: editEmp.permanent_location || null,
      };

      const res = await fetch('https://attendancebackend.duckdns.org/api/editemployees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update employee');
      }

      alert('Employee updated successfully.');
      closeEditModal();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      console.error(err);
      alert('Error updating employee: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Remove employee handlers
  const openRemoveModal = () => {
    setRemoveId('');
    setRemoveModalVisible(true);
  };
  const closeRemoveModal = () => setRemoveModalVisible(false);

  const handleRemove = async () => {
    if (!removeId) {
      alert('Please enter an employee ID to remove.');
      return;
    }
    if (!window.confirm(`Remove employee with ID "${removeId}"?`)) return;
    try {
      const res = await fetch(`https://attendancebackend.duckdns.org/api/employees/${encodeURIComponent(removeId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to remove employee');
      }
      alert('Employee removed.');
      closeRemoveModal();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      console.error(err);
      alert('Error removing employee: ' + (err.message || err));
    }
  };

  const openViewModal = async () => {
    try {
      const res = await fetch("https://attendancebackend.duckdns.org/api/viewemployees");
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load employees");
      setEmployees(data.employees);
      setViewModalVisible(true);
    } catch (err) {
      alert("Error fetching employees: " + err.message);
    }
  };

  const closeViewModal = () => setViewModalVisible(false);

  return (
    <SidebarLayout currentTime={currentTime} username={username}>
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={UserX} title="Absent" value={stats.absent} onClick={() => handleStatCardClick('Absent', 'Absent Employees')} />
        <StatCard icon={UserCheck} title="On Time" value={stats.onTime} onClick={() => handleStatCardClick('Present', 'On Time Employees')} />
        <StatCard icon={Clock} title="Late Arrival" value={stats.lateArrival} onClick={() => handleStatCardClick('Late', 'Late Arrivals')} />
        <StatCard icon={Calendar} title="Time-off" value={stats.timeOff} onClick={() => handleStatCardClick('On Leave', 'On Leave Employees')} />
      </div>

      {/* UPDATE ATTENDANCE Modal */}
      {updateModalVisible && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Update Attendance</h3>
                <p className="employee-info">
                  {updateData.employee_name} &nbsp;
                  <span className="employee-id">({updateData.employee_id})</span>
                </p>
              </div>
              <button className="close-btn" onClick={closeUpdateModal}>✕</button>
            </div>

            <form className="update-form" onSubmit={handleUpdateSubmit}>
              <label>
                Current Location
                <input
                  type="text"
                  value={updateData.current_location}
                  onChange={(e) => setUpdateData({ ...updateData, current_location: e.target.value })}
                />
              </label>

              <label>
                Status
                <select
                  className="status-select"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <option value="">Select status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </label>

              <div className="time-fields">
                <label>
                  Check-in
                  <div className="time-input-group">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="hh"
                      value={updateData.check_in_hour || ""}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_in_hour: e.target.value })
                      }
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="mm"
                      value={updateData.check_in_minute || ""}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_in_minute: e.target.value })
                      }
                    />
                    <select
                      value={updateData.check_in_ampm || "AM"}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_in_ampm: e.target.value })
                      }
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>

                <label>
                  Check-out
                  <div className="time-input-group">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="hh"
                      value={updateData.check_out_hour || ""}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_out_hour: e.target.value })
                      }
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="mm"
                      value={updateData.check_out_minute || ""}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_out_minute: e.target.value })
                      }
                    />
                    <select
                      value={updateData.check_out_ampm || "AM"}
                      onChange={(e) =>
                        setUpdateData({ ...updateData, check_out_ampm: e.target.value })
                      }
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="update-form-actions">
                <button type="button" className="btn-cancel" onClick={closeUpdateModal}>Cancel</button>
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats modal */}
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

      {/* Employee Management Section */}
      <div className="employee-management">
        <div className="employee-card add-employee" onClick={openAddModal}>
          <h3>Add Employee</h3>
          <button className="action-btn" type="button">+ Add</button>
        </div>
        <div className="employee-card edit-employee" onClick={openEditModal}>
          <h3>Edit Employee</h3>
          <button className="action-btn" type="button">✎ Edit</button>
        </div>
        <div className="employee-card remove-employee" onClick={openRemoveModal}>
          <h3>Remove Employee</h3>
          <button className="action-btn" type="button">- Remove</button>
        </div>
        <div className="employee-card view-employee" onClick={openViewModal}>
          <h3>View Employees</h3>
          <button className="action-btn" type="button">👁 View</button>
        </div>
      </div>

      {/* ADD EMPLOYEE Modal */}
      {addModalVisible && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="add-employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h2>New Employee INFO</h2>
              <button className="close-btn" onClick={closeAddModal}>✕</button>
            </div>

            <form className="add-modal-body" onSubmit={handleAddSubmit}>
              <label className="form-field">
                <span className="label-text">Employee ID</span>
                <input
                  type="text"
                  value={newEmp.employee_id}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, employee_id: e.target.value }))}
                  placeholder="enter ID"
                  required
                />
              </label>

              <label className="form-field">
                <span className="label-text">Name</span>
                <input
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </label>

              <label className="form-field">
                <span className="label-text">email id</span>
                <input
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </label>

              <label className="form-field">
                <span className="label-text">phone no.</span>
                <input
                  type="tel"
                  value={newEmp.phone_no}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, phone_no: e.target.value }))}
                  placeholder="+91 55555 55555"
                />
              </label>

              <label className="form-field">
                <span className="label-text">position</span>
                <input
                  type="text"
                  value={newEmp.position}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, position: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="label-text">Branch</span>
                <input
                  type="text"
                  value={newEmp.permanent_location}
                  onChange={(e) => setNewEmp(prev => ({ ...prev, permanent_location: e.target.value }))}
                  placeholder="Enter branch location"
                />
              </label>

              <label className="form-field upload-field">
                <span className="label-text">Upload Photo</span>
                <input type="file" accept="image/*" onChange={onPhotoChange} />
              </label>

              <div className="add-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeAddModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE Modal */}
      {editModalVisible && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="add-employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <h2>Edit Employee INFO</h2>
              <button className="close-btn" onClick={closeEditModal}>✕</button>
            </div>

            <form className="add-modal-body" onSubmit={handleEditSubmit}>
              <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                <span className="label-text">Employee ID</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={editEmp.employee_id}
                    onChange={(e) => setEditEmp(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="Enter ID to edit"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-load-details"
                    onClick={handleLoadEmployee}
                  >
                    Load Details
                  </button>
                </div>
              </label>

              <label className="form-field">
                <span className="label-text">Name</span>
                <input
                  type="text"
                  value={editEmp.name}
                  onChange={(e) => setEditEmp(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </label>

              <label className="form-field">
                <span className="label-text">email id</span>
                <input
                  type="email"
                  value={editEmp.email}
                  onChange={(e) => setEditEmp(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </label>

              <label className="form-field">
                <span className="label-text">phone no.</span>
                <input
                  type="tel"
                  value={editEmp.phone_no}
                  onChange={(e) => setEditEmp(prev => ({ ...prev, phone_no: e.target.value }))}
                  placeholder="+91 55555 55555"
                />
              </label>

              <label className="form-field">
                <span className="label-text">position</span>
                <input
                  type="text"
                  value={editEmp.position}
                  onChange={(e) => setEditEmp(prev => ({ ...prev, position: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="label-text">Branch</span>
                <input
                  type="text"
                  value={editEmp.permanent_location}
                  onChange={(e) => setEditEmp(prev => ({ ...prev, permanent_location: e.target.value }))}
                  placeholder="Enter branch location"
                />
              </label>

              <div className="add-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE EMPLOYEE Modal */}
      {removeModalVisible && (
        <div className="modal-overlay" onClick={closeRemoveModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Employee</h3>
              <button className="close-btn" onClick={closeRemoveModal}>✕</button>
            </div>
            <div className="modal-body">
              <label style={{display:'block', marginBottom: '10px'}}>
                Employee ID
                <input
                  type="text"
                  value={removeId}
                  onChange={(e) => setRemoveId(e.target.value)}
                  placeholder="Enter employee ID to remove"
                  style={{ display: 'block', width: '100%', padding: '8px', marginTop: '6px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn-secondary" onClick={closeRemoveModal}>Cancel</button>
                <button className="btn-primary" onClick={handleRemove}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EMPLOYEES Modal */}
      {viewModalVisible && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>All Employees</h3>
              <button className="close-btn" onClick={closeViewModal}>✕</button>
            </div>
            <div className="modal-body">
              {employees.length === 0 ? (
                <p>No employees found.</p>
              ) : (
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Position</th>
                      <th>Branch</th>
                      <th>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.employee_id}>
                        <td>{emp.employee_id}</td>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.phone_no || "--"}</td>
                        <td>{emp.position || "--"}</td>
                        <td>{emp.permanent_location || "--"}</td>
                        <td>{emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">
            Attendance - {formatSelectedDate(selectedDate)}
            <span className="employee-count">({stats.totalEmployees} Records)</span>
          </h3>
          <div className="table-actions">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
              max={new Date().toISOString().split('T')[0]}
            />
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9">Loading attendance...</td></tr>
              ) : error ? (
                <tr><td colSpan="9">Error: {error}</td></tr>
              ) : attendanceData.length === 0 ? (
                <tr><td colSpan="9">No attendance records found for {formatSelectedDate(selectedDate)}</td></tr>
              ) : (
                attendanceData
                  .filter(e => 
                    e.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.employee_id.toString().includes(searchTerm)
                  )
                  .map(e => (
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
                      <td>
                        <button
                          className="btn-small"
                          onClick={() => openUpdateModal(e)}
                        >
                        ✎ Update
                        </button>
                      </td>
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

export default Home;