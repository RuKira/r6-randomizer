import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import OperatorRandomizerUI from './OperatorRandomizerUI';
import Overlay from './Overlay';

function App() {
  return (
    <Router basename="/r6-randomizer">
      <Routes>
        <Route path="/" element={<OperatorRandomizerUI />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </Router>
  );
}

export default App;
