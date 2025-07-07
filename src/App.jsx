import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import CreateAccount from './pages/CreateAccount';
import Home from './pages/home';
import Requests from './pages/requests';
import WorkingHours from './pages/working_hours'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/working-hours" element={<WorkingHours />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
