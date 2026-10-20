import { createContext, useContext } from 'react'

// Session and sync status, shared across screens. `session` is undefined while loading, null for
// guests, and a Supabase session for signed-in users.
export const SessionContext = createContext({
  session: null,
  sync: { status: 'idle', message: '' },
})

export const useSession = () => useContext(SessionContext)
