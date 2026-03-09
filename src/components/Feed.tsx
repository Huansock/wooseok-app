import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { supabase } from '../lib/supabase'

type Page = {
    id: string
    author_id: string
    book_id: string
    md_text: string
    created_at: string
    profiles: {
        username: string | null
    } | null
}

export default function Feed() {
    const [pages, setPages] = useState<Page[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPages()
    }, [])

    async function fetchPages() {
        setLoading(true)
        const { data, error } = await supabase
            .from('pages')
            .select('*, profiles(username)')
            .order('created_at', { ascending: true })

        if (!error && data) {
            setPages(data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        )
    }

    if (pages.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>아직 페이지가 없습니다.</Text>
            </View>
        )
    }

    return (
        <FlatList
            data={pages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Markdown style={markdownStyles}>{item.md_text}</Markdown>
                    <Text style={styles.author}>written by {item.profiles?.username ?? '알 수 없음'}</Text>
                    <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
            )}
        />
    )
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
    },
    list: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
    },
    text: {
        fontSize: 15,
        marginBottom: 8,
    },
    meta: {
        fontSize: 12,
        color: '#999',
    },
    author: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
    },
})

// react-native-markdown-display는 일반 객체로 스타일을 받음
const markdownStyles = {
    body: {
        fontSize: 15,
        color: '#222',
        marginBottom: 8,
    },
    heading1: { fontSize: 22, fontWeight: '700' as const },
    heading2: { fontSize: 18, fontWeight: '700' as const },
    heading3: { fontSize: 15, fontWeight: '700' as const },
    code_inline: {
        backgroundColor: '#e8e8e8',
        borderRadius: 4,
        paddingHorizontal: 4,
        fontFamily: 'monospace',
    },
    fence: {
        backgroundColor: '#e8e8e8',
        borderRadius: 8,
        padding: 12,
    },
}
