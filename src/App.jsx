import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import NewNEO from "./NEO-VISION/NewNEO";

function App() {
  const isAuthenticated = !!localStorage.getItem('email');

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={ isAuthenticated ? <NewNEO /> : <Login />} /> */}
        <Route path="/" element={<NewNEO />} />
        {/* <Route 
          path="/dashboard" 
          element={isAuthenticated ? <NewNEO /> : <Navigate to="/" />} 
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
