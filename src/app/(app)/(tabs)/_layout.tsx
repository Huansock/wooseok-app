import { Tabs, useRouter } from 'expo-router'
import { Text, TouchableOpacity } from 'react-native'

export default function TabsLayout() {
    const router = useRouter()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 72,
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🏠</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="write-tab"
                options={{
                    title: '',
                    tabBarButton: () => (
                        <TouchableOpacity
                            onPress={() => router.push('/write' as never)}
                            style={{
                                width: 52,
                                height: 52,
                                backgroundColor: '#000',
                                borderRadius: 26,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 8,
                                alignSelf: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 20 }}>✏️</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>👤</Text>
                    ),
                }}
            />
        </Tabs>
    )
}
