import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSession } from '../lib/session-context'
import { supabase } from '../lib/supabase'

export default function WriteScreen() {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { session } = useSession()

    async function handleSubmit() {
        if (!text.trim()) {
            Alert.alert('Please enter some content.')
            return
        }
        if (!session) return

        setLoading(true)
        const { error } = await supabase.from('pages').insert({
            author_id: session.user.id,
            md_text: text.trim(),
        })

        if (error) {
            Alert.alert('Failed to save', error.message)
        } else {
            setText('')
            router.back()
        }
        setLoading(false)
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Write a Page</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Write something..."
                multiline
                value={text}
                onChangeText={setText}
                autoFocus
            />

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitText}>{loading ? 'Saving...' : 'Post'}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    cancel: {
        fontSize: 15,
        color: '#888',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#000',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
    },
    disabled: {
        backgroundColor: '#aaa',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
