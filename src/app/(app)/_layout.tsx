import { Redirect } from 'expo-router'
import { Drawer } from 'expo-router/drawer'
import { useSession } from '../../lib/session-context'

export default function AppLayout() {
    const { session } = useSession()

    if (!session) {
        return <Redirect href={'/(auth)' as never} />
    }

    return (
        <Drawer
            screenOptions={{
                headerShown: true,
                drawerStyle: { backgroundColor: '#fff' },
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    title: 'Home',
                    drawerLabel: 'Home',
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    drawerLabel: 'Settings',
                }}
            />
        </Drawer>
    )
}
