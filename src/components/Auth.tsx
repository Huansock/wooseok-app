import { Button, IconProps, Input } from '@rneui/themed'
import React, { useState } from 'react'
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh()
    } else {
        supabase.auth.stopAutoRefresh()
    }
})

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [awaitingVerification, setAwaitingVerification] = useState(false)

    async function signInWithEmail() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) Alert.alert(error.message)
        setLoading(false)
    }

    async function signUpWithEmail() {
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (error) {
            Alert.alert(error.message)
        } else if (!session) {
            // 이메일 인증이 필요한 경우
            setAwaitingVerification(true)
        }
        setLoading(false)
    }

    // 이메일 인증 대기 화면
    if (awaitingVerification) {
        return (
            <View style={styles.verificationContainer}>
                <Text style={styles.verificationIcon}>📬</Text>
                <Text style={styles.verificationTitle}>이메일을 확인해주세요</Text>
                <Text style={styles.verificationSubtitle}>
                    <Text style={styles.emailHighlight}>{email}</Text>
                    {'\n'}으로 인증 링크를 보냈습니다.{'\n'}
                    링크를 클릭하면 로그인됩니다.
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        setAwaitingVerification(false)
                        setEmail('')
                        setPassword('')
                    }}
                >
                    <Text style={styles.backButtonText}>← 로그인으로 돌아가기</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Input
                    label="Email"
                    leftIcon={{ type: 'font-awesome', name: 'envelope' } as IconProps}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize={'none'}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <Input
                    label="Password"
                    leftIcon={{ type: 'font-awesome', name: 'lock' } as IconProps}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    autoCapitalize={'none'}
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
            </View>
            <View style={styles.verticallySpaced}>
                <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
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
    verificationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    verificationIcon: {
        fontSize: 64,
    },
    verificationTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    verificationSubtitle: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        lineHeight: 24,
    },
    emailHighlight: {
        fontWeight: '600',
        color: '#000',
    },
    backButton: {
        marginTop: 16,
        padding: 12,
    },
    backButtonText: {
        color: '#888',
        fontSize: 14,
    },
})