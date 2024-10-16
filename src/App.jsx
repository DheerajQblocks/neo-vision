import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import NewNEO from "./NEO-VISION/NewNEO";

function App() {
  const isAuthenticated = !!localStorage.getItem('auth_token');
console.log('import.meta.env.VITE_API_URL', import.meta.env.VITE_API_URL)
  return (
    <Router>
      <Routes>
        <Route path="/" element={ isAuthenticated ? <NewNEO /> : <Login />} />
        {/* <Route path="/" element={<NewNEO />} /> */}
        {/* <Route 
          path="/dashboard" 
          element={isAuthenticated ? <NewNEO /> : <Navigate to="/" />} 
        /> */}
      </Routes>
    </Router>
  );
}

export default App;
