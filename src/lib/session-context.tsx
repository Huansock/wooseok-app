import { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

type SessionContextType = {
    session: Session | null
    initialized: boolean
}

const SessionContext = createContext<SessionContextType>({ session: null, initialized: false })

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setInitialized(true)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <SessionContext.Provider value={{ session, initialized }}>
            {children}
        </SessionContext.Provider>
    )
}

export function useSession() {
    return useContext(SessionContext)
}
