import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SessionProvider, useSession } from '../lib/session-context'

function AuthGuard() {
    const { session, initialized } = useSession()
    const segments = useSegments()
    const router = useRouter()

    useEffect(() => {
        if (!initialized) return

        const inAuthGroup = (segments[0] as string) === '(auth)'

        if (!session && !inAuthGroup) {
            router.replace('/(auth)' as never)
        } else if (session && inAuthGroup) {
            router.replace('/(app)/(tabs)' as never)
        }
    }, [session, initialized, segments])

    if (!initialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen
                name="write"
                options={{ presentation: 'modal', headerShown: false }}
            />
        </Stack>
    )
}

export default function RootLayout() {
    return (
        <SessionProvider>
            <AuthGuard />
        </SessionProvider>
    )
}
