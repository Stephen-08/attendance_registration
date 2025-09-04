import React, { useEffect, useState } from 'react';
import SidebarLayout from '../pages/SidebarLayout';
import './requests.css';

const Requests = () => {
  const [lateRequests, setLateRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // -------------------- FETCH FUNCTIONS --------------------
  const fetchLateArrival = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/late-arrival-requests");
      const data = await res.json();
      setLateRequests(data);
    } catch (err) {
      console.error("Fetch error (Late Arrival):", err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/leave-requests");
      const data = await res.json();
      setLeaveRequests(data);
    } catch (err) {
      console.error("Fetch error (Leave Requests):", err);
    }
  };

  useEffect(() => {
    fetchLateArrival();
    fetchLeaveRequests();
  }, []);

  // -------------------- STATUS HANDLERS --------------------
  const handleLateStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/late-arrival-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update Late Arrival status");

      window.dispatchEvent(new Event("attendance-updated"));
      await fetchLateArrival();
    } catch (err) {
      console.error("Update error (Late Arrival):", err);
      alert("Failed to update late arrival status.");
    }
  };

  const handleLeaveStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update Leave Request status");

      window.dispatchEvent(new Event("attendance-updated"));
      await fetchLeaveRequests();
    } catch (err) {
      console.error("Update error (Leave Request):", err);
      alert("Failed to update leave request status.");
    }
  };

  return (
    <SidebarLayout>
      <div className="requests-page">
        {/* Late Arrival Section */}
        <Section
          title="Late Arrival Requests"
          type="late"
          data={lateRequests}
          onStatusChange={handleLateStatusChange}
        />

        {/* Leave Request Section */}
        <Section
          title="Leave Requests"
          type="leave"
          data={leaveRequests}
          onStatusChange={handleLeaveStatusChange}
        />
      </div>
    </SidebarLayout>
  );
};

// -------------------- REUSABLE SECTION --------------------
const Section = ({ title, data, type, onStatusChange }) => {
  const [confirming, setConfirming] = useState({ id: null, action: null });

  const confirmAction = (id, action) => setConfirming({ id, action });
  const cancelAction = () => setConfirming({ id: null, action: null });

  const confirmStatusChange = () => {
    if (confirming.id && confirming.action) {
      onStatusChange(confirming.id, confirming.action);
      setConfirming({ id: null, action: null });
    }
  };

  return (
    <div className="request-section">
      <div className="section-header">
        <h2>{title}</h2>
        <div className="controls">
          <input type="text" placeholder="🔍 Quick Search..." />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            {type === "leave" ? (
              <>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Request Date</th>
                <th>Status</th>
              </>
            ) : (
              <>
                <th>Employee ID</th>
                <th>Employee</th>
                <th>Branch</th>
                <th>Requested At</th>
                <th>Status</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={type === "leave" ? 7 : 4}>No requests found</td>
            </tr>
          ) : (
            data.map((entry, i) => (
              <tr key={i}>
                {type === "leave" ? (
                  <>
                    <td>{entry.employee_id}</td>
                    <td>{entry.name}</td>
                    <td>{entry.start_date}</td>
                    <td>{entry.end_date}</td>
                    <td>{entry.reason}</td>
                    <td>{entry.request_date}</td>
                    <td>
                      {entry.status === "Approved" || entry.status === "Rejected" ? (
                        <span className={entry.status === "Approved" ? "status-accept" : "status-reject"}>
                          {entry.status}
                        </span>
                      ) : confirming.id === entry.request_id ? (
                        <div className="confirm-box">
                          <span>Confirm {confirming.action}?</span>
                          <button className="confirm-btn" onClick={confirmStatusChange}>Yes</button>
                          <button className="cancel-btn" onClick={cancelAction}>No</button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="reject-btn"
                            onClick={() => confirmAction(entry.request_id, "Rejected")}
                          >
                            Reject
                          </button>
                          <button
                            className="accept-btn"
                            onClick={() => confirmAction(entry.request_id, "Approved")}
                          >
                            Accept
                          </button>
                        </>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td>{entry.employee_id}</td>
                    <td>{entry.name}</td>
                     <td>{entry.branch}</td>
                    <td>{entry.requested_at}</td>
                    <td>
                      {entry.status === "Accepted" || entry.status === "Rejected" ? (
                        <span className={entry.status === "Accepted" ? "status-accept" : "status-reject"}>
                          {entry.status}
                        </span>
                      ) : confirming.id === entry.request_id ? (
                        <div className="confirm-box">
                          <span>Confirm {confirming.action}?</span>
                          <button className="confirm-btn" onClick={confirmStatusChange}>Yes</button>
                          <button className="cancel-btn" onClick={cancelAction}>No</button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="reject-btn"
                            onClick={() => confirmAction(entry.request_id, "Rejected")}
                          >
                            Reject
                          </button>
                          <button
                            className="accept-btn"
                            onClick={() => confirmAction(entry.request_id, "Accepted")}
                          >
                            Accept
                          </button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Requests;
