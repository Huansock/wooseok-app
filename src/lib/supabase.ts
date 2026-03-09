import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
export const REDIRECT_URL = process.env.EXPO_PUBLIC_REDIRECT_URL!

// SSR(Node.js) 환경에서는 window가 없으므로 플랫폼별로 안전하게 처리
const storage = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return null
            return localStorage.getItem(key)
        }
        return SecureStore.getItemAsync(key)
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return
            localStorage.setItem(key, value)
            return
        }
        SecureStore.setItemAsync(key, value)
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined') return
            localStorage.removeItem(key)
            return
        }
        SecureStore.deleteItemAsync(key)
    },
}

// As Expo's SecureStore does not support values larger than 2048
// bytes, an AES-256 key is generated and stored in SecureStore, while
// it is used to encrypt/decrypt values stored in AsyncStorage.
class LargeSecureStore {
    private async _encrypt(key: string, value: string) {
        const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));

        const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
        const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

        await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));

        return aesjs.utils.hex.fromBytes(encryptedBytes);
    }

    private async _decrypt(key: string, value: string) {
        const encryptionKeyHex = await SecureStore.getItemAsync(key);
        if (!encryptionKeyHex) {
            return encryptionKeyHex;
        }

        const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
        const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

        return aesjs.utils.utf8.fromBytes(decryptedBytes);
    }

    async getItem(key: string) {
        const encrypted = await AsyncStorage.getItem(key);
        if (!encrypted) { return encrypted; }

        return await this._decrypt(key, encrypted);
    }

    async removeItem(key: string) {
        await AsyncStorage.removeItem(key);
        await SecureStore.deleteItemAsync(key);
    }

    async setItem(key: string, value: string) {
        const encrypted = await this._encrypt(key, value);

        await AsyncStorage.setItem(key, encrypted);
    }
}


// 웹에서는 SecureStore를 사용할 수 없으므로 localStorage 기반 storage를 사용
// 네이티브(iOS/Android)에서만 LargeSecureStore (AES + SecureStore) 사용
const authStorage = Platform.OS === 'web' ? storage : new LargeSecureStore()

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: authStorage,                                  // 플랫폼/환경별 안전한 세션 저장소
        autoRefreshToken: true,        // 토큰 자동 갱신
        persistSession: true,          // 앱 재시작 후에도 로그인 유지
        detectSessionInUrl: Platform.OS === 'web', // 웹에서만 URL의 세션 토큰 감지
        flowType: 'pkce',              // 호스팅 Supabase 보안 인증 방식
    },
})