import React, { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import SidebarLayout from "./SidebarLayout";
import "./monthly_record.css";

const Monthly = () => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("month"); // "month" or "dateRange"
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [periodInfo, setPeriodInfo] = useState(null);

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(currentMonth);
    fetchDynamicRecords(getMonthDateRange(currentMonth));
  }, []);

  // Helper function to get start and end dates for a month
  const getMonthDateRange = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    return { startDate, endDate };
  };

  // Fetch records for a specific date range
  const fetchDynamicRecords = async (dateRange) => {
    setLoading(true);
    try {
      const response = await fetch("https://attendancebackend.duckdns.org/api/monthlyrecords/dynamic", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
        setPeriodInfo(data.period);
      } else {
        console.error("API Error:", data.error);
        setRecords([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle month selection
  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    if (month) {
      const dateRange = getMonthDateRange(month);
      fetchDynamicRecords(dateRange);
    }
  };

  // Handle date range selection
  const handleDateRangeSubmit = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        alert("Start date must be before end date");
        return;
      }
      fetchDynamicRecords({ startDate, endDate });
    } else {
      alert("Please select both start and end dates");
    }
  };

  // Handle filter type change
  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type === "month" && selectedMonth) {
      const dateRange = getMonthDateRange(selectedMonth);
      fetchDynamicRecords(dateRange);
    }
  };

  // Filtered records by search
  const filteredRecords = records.filter(
    (rec) =>
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.id.toString().includes(searchQuery) ||
      rec.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="Monthly-Records-container">
        <div className="table-container">
          {/* Header row with title + search bar */}
<div className="table-header">
  <span className="header-title">Monthly Record</span>
  
  {/* Enhanced Search Bar */}
  <div className="search-container">
    <div className="search-wrapper">
      {/* Search Icon */}
      <svg 
        className="search-icon" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      
      {/* Search Input */}
      <input
        type="text"
        className="search-input-enhanced"
        placeholder="Search employee..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Clear Button */}
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="clear-button"
          type="button"
        >
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  </div>
</div>

          {/* Date Filter Section */}
          <div className="date-filter-section">
            <div className="filter-type-selector">
              <button 
                className={filterType === "month" ? "active" : ""}
                onClick={() => handleFilterTypeChange("month")}
              >
                Select Month
              </button>
              <button 
                className={filterType === "dateRange" ? "active" : ""}
                onClick={() => handleFilterTypeChange("dateRange")}
              >
                Date Range
              </button>
            </div>

            {filterType === "month" ? (
              <div className="month-selector">
                <label htmlFor="month-input">Select Month:</label>
                <input
                  id="month-input"
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  max={new Date().toISOString().slice(0, 7)} // Don't allow future months
                />
              </div>
            ) : (
              <div className="date-range-selector">
                <div className="date-input-group">
                  <label htmlFor="start-date">From:</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                  />
                </div>
                <div className="date-input-group">
                  <label htmlFor="end-date">To:</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    min={startDate} // End date should be after start date
                  />
                </div>
                <button 
                  className="apply-filter-btn"
                  onClick={handleDateRangeSubmit}
                  disabled={!startDate || !endDate}
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>

          {/* Period Information */}
          {periodInfo && (
            <div className="period-info">
              <span>
                Showing records from {new Date(periodInfo.start_date).toLocaleDateString()} 
                to {new Date(periodInfo.end_date).toLocaleDateString()}
                ({periodInfo.total_working_days} working days elapsed)
              </span>
              <br />
              
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="loading-indicator">
              Loading records...
            </div>
          )}

          {/* Table */}
          <table className="records-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Branch</th>
                <th>Days Present</th>
                <th>Late Days</th>
                <th>Total Days Worked</th>
                <th>Leaves Taken</th>
                <th>Overtime Days</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, index) => (
                  <tr key={rec.id}>
                    <td>{rec.id}</td>
                    <td>{rec.name}</td>
                    <td>{rec.branch}</td>
                    <td>{rec.daysPresent}</td>
                    <td>{rec.lateDays}</td>
                    <td>{rec.daysWorked}</td>
                    <td>{rec.leavesTaken}</td>
                    <td>{rec.overtime}</td>
                    <td>
                      <span className={`attendance-rate ${rec.attendanceRate >= 80 ? 'good' : rec.attendanceRate >= 60 ? 'average' : 'poor'}`}>
                        {rec.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    {loading ? "Loading..." : "No matching records found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Monthly;