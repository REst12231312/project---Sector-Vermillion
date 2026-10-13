import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePages from '../../pages/HomePages'
import FactionPages from '../../pages/FactionPages'
import PlayerPages from '../../pages/PlayerPages'
import QuizPage from '../../pages/QuizPage'
import MainLayout from '../../layout/MainLayout'
import SealedArchivePage from '../../pages/SealedArchivePage'
import AuthPage from '../../pages/AuthPage'
import { isAuthenticated } from '../../utils/api'

function RequireAuth() {
    const location = useLocation()
    return isAuthenticated() ? <MainLayout /> : <Navigate to="/login" replace state={{ from: location }} />
}

export default function App() {

    return (
        <div>
            <Routes>
                <Route path='/login' element={<AuthPage />} />
                <Route path='/register' element={<AuthPage register />} />
                <Route path='/' element={<RequireAuth />}>
                    <Route index element={<HomePages />} />
                    <Route path='factions' element={<FactionPages />} />
                    <Route path='factions/:factionId' element={<FactionPages />} />
                    <Route path='profile' element={<PlayerPages />} />
                    <Route path='quiz' element={<QuizPage />} />
                    <Route path='archive/sector-ix' element={<SealedArchivePage />} />
                </Route>
            </Routes>
        </div>
    )
}
