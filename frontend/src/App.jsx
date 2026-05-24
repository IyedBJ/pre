import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import { DataProvider } from './context/DataContext'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/Shared/PrivateRoute';
import Simulation from './pages/Simulation';

const App = () => {
  return (
    <DataProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/login' element={<Login />} />
            
            <Route element={<PrivateRoute />}>
              <Route path='/' element={<Navigate to="/home" />} />
              <Route path='/home' element={<Home />} /> 
              <Route path='/saisie-individuelle' element={<Home />} />
              <Route path='/saisie-salarie' element={<Home />} /> 
              <Route path='/saisie-groupe' element={<Home />} /> 
              <Route path='/historique' element={<Home />} /> 
              <Route path='/gestion-salaries' element={<Home />} /> 
              <Route path='/clients' element={<Home />} /> 
              <Route path='/gestion-projets' element={<Home />} /> 
              <Route path='/facturation' element={<Home />} /> 
              <Route path='/prevision-ia' element={<Home />} /> 
              <Route path='/simulation' element={<Home />} /> 
              <Route path='/parameters' element={<Home />} />
            </Route>

            <Route path='*' element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </DataProvider>
  )
}

export default App