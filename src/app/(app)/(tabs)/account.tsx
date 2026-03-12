import { Button, Input } from '@rneui/themed'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useSession } from '../../../lib/session-context'
import { supabase } from '../../../lib/supabase'

export default function AccountScreen() {
    const { session } = useSession()
    const [loading, setLoading] = useState(true)
    const [username, setUsername] = useState('')

    useEffect(() => {
        if (session) getProfile()
    }, [session])

    if (!session) return <Redirect href={'/(auth)' as never} />

    async function getProfile() {
        try {
            setLoading(true)
            const { data, error, status } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session!.user.id)
                .single()

            if (error && status !== 406) throw error
            if (data) setUsername(data.username)
        } catch (error) {
            if (error instanceof Error) Alert.alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function updateProfile() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .update({ username, updated_at: new Date() })
                .eq('id', session!.user.id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('No rows were updated.')
        } catch (error) {
            if (error instanceof Error) Alert.alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Input label="Email" value={session.user.email} disabled />
            </View>
            <View style={styles.verticallySpaced}>
                <Input label="Username" value={username || ''} onChangeText={setUsername} />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Button
                    title={loading ? 'Loading ...' : 'Update'}
                    onPress={updateProfile}
                    disabled={loading}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 12,
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
})
