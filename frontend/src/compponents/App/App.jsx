import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePages from '../../pages/HomePages'
import FactionPages from '../../pages/FactionPages'
import PlayerPages from '../../pages/PlayerPages'
import QuizPage from '../../pages/QuizPage'
import MainLayout from '../../layout/MainLayout'
import AuthPage from '../../pages/AuthPage'
import ImperiumArchivePage from '../../pages/ImperiumArchivePage'
import TacticalDemoPage from '../../features/planetaryCampaign/pages/TacticalDemoPage'
import TerritoryDemoPage from '../../features/planetaryCampaign/pages/TerritoryDemoPage'
import PlanetCampaignPage from '../../features/planetaryCampaign/pages/PlanetCampaignPage'
import { applyServerProgress } from '../../utils/gameProgress'
import { apiRequest, getCurrentUser, isAuthenticated } from '../../utils/api'

function RequireAuth({ children }) {
    const location = useLocation()
    return isAuthenticated() ? children : <Navigate to="/login" replace state={{ from: location }} />
}

export default function App() {
    const [currentUser, setCurrentUser] = React.useState(getCurrentUser)
    const userIdentity = currentUser?.id || currentUser?._id || currentUser?.username

    React.useEffect(() => {
        const updateUser = (event) => setCurrentUser(event.detail || getCurrentUser())
        window.addEventListener('sv-user-updated', updateUser)
        return () => window.removeEventListener('sv-user-updated', updateUser)
    }, [])

    React.useEffect(() => {
        if (!isAuthenticated() || !userIdentity) return
        let active = true
        apiRequest('/progress').then((progress) => {
            if (active) applyServerProgress(progress)
        }).catch(() => {})
        return () => { active = false }
    }, [userIdentity])

    return (
        <div>
            <Routes>
                <Route path='/login' element={<AuthPage />} />
                <Route path='/register' element={<AuthPage register />} />
                <Route path='/tactical-demo' element={<TacticalDemoPage />} />
                <Route path='/territory-demo' element={<TerritoryDemoPage />} />
                <Route path='/planet-campaign' element={<PlanetCampaignPage />} />
                <Route path='/planets/:planetId/eras/:eraId' element={<PlanetCampaignPage />} />
                <Route path='/' element={<MainLayout />}>
                    <Route index element={<HomePages />} />
                    <Route path='factions' element={<FactionPages />} />
                    <Route path='factions/:factionId' element={<FactionPages />} />
                    <Route path='profile' element={<RequireAuth><PlayerPages /></RequireAuth>} />
                    <Route path='campaign' element={<RequireAuth><QuizPage /></RequireAuth>} />
                    <Route path='quiz' element={<Navigate to='/campaign' replace />} />
                    <Route path='archive/:factionId' element={<RequireAuth><ImperiumArchivePage /></RequireAuth>} />
                    <Route path='archive/:factionId/:recordId' element={<RequireAuth><ImperiumArchivePage /></RequireAuth>} />
                </Route>
            </Routes>
        </div>
    )
}
