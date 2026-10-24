import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import '../i18n'
import App from '../App'
import { AGE_VERIFIED_STORAGE_KEY } from './AgeGate'

describe('LunaWidget navigation, form-focus auto-hide, and shared thread sync', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem(AGE_VERIFIED_STORAGE_KEY, 'true')
    window.localStorage.setItem('hercycle.onboarding.complete', 'true')
    global.fetch = jest.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ configured: false }),
    }))
  })

  test('renders launcher on Home, auto-hides when interacting with a form on /log, and syncs live thread to /luna', async () => {
    render(<App initialRouterEntries={['/log']} />)

    const launcher = await screen.findByLabelText(/open luna chat/i)
    const widgetRoot = screen.getByTestId('luna-widget-root')
    expect(widgetRoot).not.toHaveClass('is-form-hidden')

    // Focusing an input inside the check-in form automatically tucks away the floating launcher
    const dateInput = screen.getByLabelText(/check-in date/i)
    act(() => {
      dateInput.focus()
      fireEvent.focusIn(dateInput)
    })
    expect(widgetRoot).toHaveClass('is-form-hidden')

    // Blurring external form controls restores the launcher cleanly
    act(() => {
      dateInput.blur()
      fireEvent.focusOut(dateInput)
    })
    await waitFor(() => {
      expect(widgetRoot).not.toHaveClass('is-form-hidden')
    })

    // Open widget, send a short 1-word message, then jump to Full View (/luna)
    fireEvent.click(launcher)
    const input = await screen.findByPlaceholderText(/ask luna anything/i)
    fireEvent.change(input, { target: { value: 'cramps' } })
    fireEvent.submit(input.closest('form'))

    await waitFor(() => {
      expect(screen.getAllByText(/prostaglandins|heat/i).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByText(/full view/i))

    // Floating widget disappears on /luna while the exact conversation message remains live
    await waitFor(() => {
      expect(screen.queryByTestId('luna-widget-root')).not.toBeInTheDocument()
    })
    expect(screen.getByText('cramps')).toBeInTheDocument()
  })
})
