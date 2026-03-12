import { Button, Input } from '@rneui/themed'
import { StyleSheet, Text, View } from 'react-native'
import { useSession } from '../../lib/session-context'
import { supabase } from '../../lib/supabase'

export default function SettingsScreen() {
    const { session } = useSession()

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.item}>
                <Input label="Email" value={session?.user?.email ?? ''} disabled />
            </View>
            <View style={styles.item}>
                <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
        marginBottom: 8,
        marginTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    item: {
        marginBottom: 8,
    },
})
