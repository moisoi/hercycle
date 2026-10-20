import React from 'react'
import { GiLotus } from 'react-icons/gi'

// The HerCycle mark. It scales with CSS, and hover glow follows the lotus shape via drop-shadow.
const Logo = ({ size = 40, className = '' }) => (
  <span className={`logo-mark ${className}`.trim()} style={{ '--logo-size': `${size}px` }} aria-hidden="true">
    <GiLotus />
  </span>
)

export default Logo
