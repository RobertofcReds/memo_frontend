import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'



function ProtectedRoute({ children }) {


  const { user, loading } = useAuth()
  const location = useLocation();
  // if (loading) {
  //   return <Loader />;
  // }


  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }}
      replace />
  }

  return children
}

export default ProtectedRoute