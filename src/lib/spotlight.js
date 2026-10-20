// Cursor spotlight. Each .spot element gets its pointer position as CSS variables, so its
// highlight follows the pointer. The highlight is static lighting and does not animate movement.
export function installSpotlight() {
  const onPointerMove = (event) => {
    const element = event.target?.closest?.('.spot')
    if (!element) return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }
  document.addEventListener('pointermove', onPointerMove, { passive: true })
  return () => document.removeEventListener('pointermove', onPointerMove)
}
