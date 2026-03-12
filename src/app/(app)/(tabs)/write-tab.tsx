import { Redirect } from 'expo-router'

export default function WriteTab() {
    return <Redirect href={'/write' as never} />
}
