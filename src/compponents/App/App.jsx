import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePages from '../../pages/HomePages'
import FactionPages from '../../pages/FactionPages'
import PlayerPages from '../../pages/PlayerPages'
import QuizPage from '../../pages/QuizPage'
import MainLayout from '../../layout/MainLayout'

export default function App() {

    return (
        <div>
            <Routes>
                <Route path='/' element={<MainLayout />}>
                    <Route index element={<HomePages />} />
                    <Route path='factions' element={<FactionPages />} />
                    <Route path='factions/:factionId' element={<FactionPages />} />
                    <Route path='profile' element={<PlayerPages />} />
                    <Route path='quiz' element={<QuizPage />} />
                </Route>
            </Routes>
        </div>
    )
}
