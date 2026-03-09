import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Account from '../components/Account'
import Auth from '../components/Auth'
import Feed from '../components/Feed'
import PageEditor from '../components/PageEditor'
import { supabase } from '../lib/supabase'

type Tab = 'feed' | 'account'

export default function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [initialized, setInitialized] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('feed')
    const [showEditor, setShowEditor] = useState(false)

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

    if (!initialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    if (!session || !session.user) {
        return <Auth />
    }

    return (
        <View style={styles.container}>
            {/* 탭 콘텐츠 */}
            <View style={styles.content}>
                {activeTab === 'feed' && <Feed />}
                {activeTab === 'account' && <Account session={session} />}
            </View>

            {/* PageEditor 모달 */}
            {showEditor && (
                <PageEditor
                    session={session}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* 하단바 */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab('feed')}
                >
                    <Text style={[styles.tabIcon, activeTab === 'feed' && styles.tabIconActive]}>🏠</Text>
                    <Text style={[styles.tabLabel, activeTab === 'feed' && styles.tabLabelActive]}>Feed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.writeButton}
                    onPress={() => setShowEditor(true)}
                >
                    <Text style={styles.writeButtonText}>✏️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab('account')}
                >
                    <Text style={[styles.tabIcon, activeTab === 'account' && styles.tabIconActive]}>👤</Text>
                    <Text style={[styles.tabLabel, activeTab === 'account' && styles.tabLabelActive]}>Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    bottomBar: {
        height: 72,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabIcon: {
        fontSize: 22,
        opacity: 0.4,
    },
    tabIconActive: {
        opacity: 1,
    },
    tabLabel: {
        fontSize: 11,
        color: '#aaa',
    },
    tabLabelActive: {
        color: '#000',
        fontWeight: '600',
    },
    writeButton: {
        width: 52,
        height: 52,
        backgroundColor: '#000',
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    writeButtonText: {
        fontSize: 20,
    },
})
