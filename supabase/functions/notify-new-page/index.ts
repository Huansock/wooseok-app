import webpush from 'npm:web-push'
import { createClient } from 'npm:@supabase/supabase-js'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL')!

webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

Deno.serve(async (req) => {
    const payload = await req.json()
    const newPage = payload.record as { md_text: string; author_id: string }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 작성자 username 조회
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', newPage.author_id)
        .single()

    const author = profile?.username ?? 'Someone'
    const preview = newPage.md_text.replace(/[#*`]/g, '').trim().slice(0, 80)

    // 작성자 본인 제외하고 모든 구독자에게 발송
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', newPage.author_id)

    if (!subscriptions || subscriptions.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const notification = JSON.stringify({
        title: `${author} posted a new page`,
        body: preview,
    })

    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                notification
            )
        )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return new Response(JSON.stringify({ sent }), { status: 200 })
})
