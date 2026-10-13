import React from 'react'
import { NavLink } from 'react-router-dom'
import './Header.css'

export default function Header() {
    return (
        <div>
            <nav>
                <ul>
                    <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>
                        <li>
                            Главная
                        </li>
                    </NavLink>
                    <NavLink to="/factions">
                        <li>
                            Фракции
                        </li>
                    </NavLink>
                    <NavLink to="/profile">
                        <li>
                            Профиль
                        </li>
                    </NavLink>
                </ul>
            </nav>
        </div>
    )
}
