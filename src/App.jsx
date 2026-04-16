import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Outing from './pages/Outing';
import Facility from './pages/Facility';
import LifeGuide from './pages/LifeGuide';
import Rules from './pages/Rules';
import Bedding from './pages/Bedding';
import Suggestions from './pages/Suggestions';
import Admin from './pages/Admin';

import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <Router>
      <SettingsProvider>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="outing" element={<Outing />} />
          <Route path="facility" element={<Facility />} />
          <Route path="life" element={<LifeGuide />} />
          <Route path="rules" element={<Rules />} />
          <Route path="bedding" element={<Bedding />} />
          <Route path="suggestions" element={<Suggestions />} />
        </Route>
      </Routes>
    </SettingsProvider>
  </Router>
  );
}

export default App;
