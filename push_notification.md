# 웹 푸시 알림 (Web Push Notification) 이해하기

## 1. 핵심 개념: 알림은 누가 보내는가?

카카오톡 알림을 생각해보세요.

- 친구가 메시지를 보내면, **카카오 서버**가 내 폰에 알림을 보냅니다.
- 내 폰은 카카오 앱이 꺼져 있어도 알림을 받을 수 있습니다.

웹 푸시도 똑같습니다. 사용자의 브라우저가 꺼져 있어도 알림을 보낼 수 있습니다.
핵심은 **"알림을 전달해주는 중간 서버"** 가 항상 켜져 있다는 점입니다.

```
새 글 작성
    ↓
우리 서버 (Supabase Edge Function)
    ↓
브라우저 회사 서버 (Chrome Push Service / Firefox Push Service)  ← 항상 켜져 있음
    ↓
사용자 브라우저 → 알림 표시
```

> 브라우저 회사(Google, Mozilla 등)가 "택배 회사" 역할을 합니다.
> 우리 서버는 택배를 "맡기는 사람", 사용자 브라우저는 "수령인"입니다.

---

## 2. 등장인물 4명

| 역할 | 실제 구현 | 설명 |
|---|---|---|
| **발신자** | Supabase Edge Function (`notify-new-page`) | 알림을 만들어서 브라우저 회사 서버에 전달 |
| **택배 회사** | Chrome Push Service 등 | Google, Firefox 등이 운영. 우리가 건드릴 수 없음 |
| **수령인 대리인** | Service Worker (`sw.js`) | 브라우저 안에서 앱이 꺼져도 살아있는 코드 |
| **신분증** | VAPID 키 쌍 | 우리 서버가 신뢰할 수 있는 발신자임을 증명 |

---

## 3. Service Worker란?

> **Service Worker** = 브라우저 안에서 백그라운드로 돌아가는 별도의 프로세스

일반적인 웹 페이지 코드(React)는 탭이 닫히면 종료됩니다.
Service Worker는 탭이 닫혀도, 심지어 브라우저가 최소화되어도 살아 있습니다.

우리의 `public/sw.js` 가 이 역할을 합니다:

```js
// 푸시 메시지가 도착하면 이 코드가 실행됨 (앱이 꺼져 있어도)
self.addEventListener('push', (event) => {
    const data = event.data.json()
    self.registration.showNotification(data.title, { body: data.body })
})
```

---

## 4. VAPID 키란?

> **VAPID (Voluntary Application Server Identification)**
> = "우리 서버가 사기꾼이 아님"을 브라우저 회사에 증명하는 공개키/비밀키 쌍

공개키(Public Key)와 비밀키(Private Key)는 자물쇠와 열쇠의 관계입니다.

- **공개키**: 누구에게나 공개. 브라우저가 "이 서버 구독할게요" 할 때 사용.
- **비밀키**: 절대 노출하면 안 됨. 서버만 알고 있음. 알림을 보낼 때 서명에 사용.

브라우저 회사 입장에서: "비밀키로 서명된 요청만 받겠다" = 인증된 서버만 알림 전송 가능.

우리 프로젝트에서:
- 공개키 → `.env`의 `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (브라우저에 전달)
- 비밀키 → Supabase Secrets의 `VAPID_PRIVATE_KEY` (서버에만 저장)

---

## 5. 전체 흐름 (딱 두 단계)

### 1단계: 구독 등록 (처음 한 번)

```
사용자가 Feed 진입
    ↓
브라우저: "알림을 허용하시겠습니까?" 팝업
    ↓ (허용)
Service Worker 등록 (sw.js가 백그라운드에서 실행되기 시작)
    ↓
브라우저가 Chrome/Firefox 서버에 "나 여기 있어요" 등록
    ↓ (브라우저 회사 서버가 고유 주소(endpoint)와 암호키를 발급)
우리 앱이 그 정보를 Supabase DB(push_subscriptions 테이블)에 저장
```

이 단계 코드: `src/lib/push.ts`의 `registerPushSubscription()`

### 2단계: 알림 발송 (새 글이 올라올 때마다)

```
누군가 새 글 작성 (pages 테이블에 INSERT)
    ↓
Supabase Database Webhook 자동 감지
    ↓
notify-new-page Edge Function 실행
    ↓
DB에서 push_subscriptions 전체 조회 (작성자 본인 제외)
    ↓
각 구독자의 endpoint(브라우저 회사 서버 주소)로 web-push 전송
    ↓
브라우저 회사 서버가 해당 사용자 브라우저에 전달
    ↓
sw.js의 'push' 이벤트 핸들러 실행 → 알림 표시
```

이 단계 코드: `supabase/functions/notify-new-page/index.ts`

---

## 6. 각 파일이 하는 일 요약

```
wooseok-app/
├── public/sw.js                              # Service Worker
│   └── push 이벤트 수신 → 브라우저 알림 표시
│
├── src/lib/push.ts                           # 구독 등록 유틸리티
│   └── registerPushSubscription()
│       ├── 알림 권한 요청
│       ├── Service Worker 등록
│       ├── 브라우저 Push 구독
│       └── 구독 정보를 Supabase에 저장
│
├── supabase/
│   ├── migrations/..._create_push_subscriptions.sql   # 구독 정보 저장 테이블
│   └── functions/notify-new-page/index.ts             # 알림 발송 Edge Function
│       ├── 새 글 데이터 수신 (Webhook으로부터)
│       ├── 구독자 목록 조회
│       └── web-push로 각 브라우저에 전송
│
└── src/app/(app)/(tabs)/index.tsx            # Feed 화면 진입 시 구독 등록 트리거
```

---

## 7. 왜 이렇게 복잡한가?

단순히 "서버 → 브라우저"로 바로 보내면 안 되냐고 생각할 수 있습니다.
안 됩니다. 이유는 두 가지입니다:

1. **브라우저는 항상 같은 IP가 아닙니다.** 카페에서, 집에서 IP가 달라집니다.
   → 브라우저 회사 서버가 브라우저의 "영구 주소록" 역할을 합니다.

2. **보안**: 아무 서버나 내 브라우저에 알림을 보낼 수 없어야 합니다.
   → VAPID 키로 발신자를 인증합니다.

---

## 8. Supabase Database Webhook이란?

> DB Webhook = "테이블에 변화가 생기면 자동으로 특정 URL을 호출해줘"

SQL 트리거(Trigger)와 비슷하지만, HTTP 요청을 보낸다는 점이 다릅니다.

```
pages 테이블에 INSERT 발생
    ↓  (Supabase 내부에서 자동 감지)
notify-new-page 함수의 URL로 POST 요청
    ↓
새 글 데이터(payload)와 함께 Edge Function 실행
```

대시보드 설정 경로: **Database → Webhooks → Create webhook**

---

## Q&A

### Q1. VAPID 키를 어떻게 얻었나요? CLI가 어떻게 작동한 건가요?

대화 중에 이 명령어를 실행했습니다:

```bash
bunx web-push generate-vapid-keys
```

`bunx`는 npm 패키지를 설치 없이 바로 실행해주는 도구입니다.
(`npx`와 같은 역할인데, bun 생태계 버전입니다.)

`web-push`는 웹 푸시 표준을 구현한 Node.js 라이브러리고,
`generate-vapid-keys` 서브커맨드가 키 쌍을 만들어줍니다.

**내부에서 일어나는 일:**

VAPID 키는 수학적으로 생성됩니다. 구체적으로는 **타원 곡선 암호(ECDSA, P-256 곡선)** 를 사용합니다.

쉽게 비유하면:

> 주사위를 굴려서 나온 숫자(랜덤값)를 씨앗(seed)으로,
> 수학 공식을 통해 **"공개키"와 "비밀키" 한 쌍**을 동시에 만들어냅니다.
> 이 둘은 수학적으로 연결되어 있어서, 비밀키로 서명하면 공개키로만 검증할 수 있습니다.

결과물:
```
Public Key:  BGM5GFBPGoMtIow...  ← 브라우저에 넘겨줌 (.env에 저장)
Private Key: 896QOmUYdA2WQ...    ← 서버만 알아야 함 (Supabase Secrets에 저장)
```

한 번만 생성하면 됩니다. 다시 생성하면 기존 구독자들의 연결이 끊어집니다.
(새 자물쇠를 만들면 기존 열쇠가 안 맞는 것처럼)

---

### Q2. 유저가 허락했을 때 무슨 일이 일어나나요? "유저마다 엔드포인트가 있다"는 게 무슨 뜻인가요?

**엔드포인트(endpoint)** 는 그냥 URL(주소)입니다.
특별한 용어처럼 들리지만, "알림을 보낼 수 있는 고유한 인터넷 주소"입니다.

우편 주소에 비유하면:

> 사람마다 집 주소가 다르듯,
> 브라우저마다 고유한 "알림 전용 주소"가 있습니다.
> 그 주소가 엔드포인트입니다.

실제로 이렇게 생겼습니다:
```
https://fcm.googleapis.com/fcm/send/fR3x9K2mL8...(매우 긴 고유 문자열)
```

**허락 버튼을 누른 순간 일어나는 일 (단계별):**

```
1. 브라우저가 Google 서버(FCM)에 접속
   "저 여기 있어요. 알림 받을 준비됐습니다."
        ↓
2. Google 서버가 이 브라우저만을 위한 고유 주소(endpoint)를 발급
   "당신 전용 주소는 https://fcm.googleapis.com/fcm/send/fR3x9K2m... 입니다."
        ↓
3. 그 주소 + 암호화 키(p256dh, auth)를 브라우저가 우리 앱에 돌려줌
        ↓
4. 우리 앱이 Supabase DB에 저장
   push_subscriptions 테이블에 한 줄 추가됨:
   { user_id: "abc", endpoint: "https://fcm...", p256dh: "...", auth: "..." }
```

**그래서 나중에 알림을 보낼 때:**

```
DB에서 endpoint 목록을 꺼냄
    ↓
각 endpoint URL로 POST 요청을 보냄
    ↓
Google 서버가 그 주소의 주인(브라우저)을 찾아서 알림 전달
```

**왜 p256dh와 auth도 저장하나요?**

알림 내용이 Google 서버를 거쳐가기 때문에 Google이 내용을 읽지 못하도록
**암호화**해서 보냅니다. p256dh와 auth는 그 암호화에 쓰이는 키입니다.

> Google에게는 "이 주소로 배달해줘"만 알려주고,
> 편지 내용 자체는 받는 사람(브라우저)만 열어볼 수 있게 잠가서 보냅니다.

---

### Q3. p256dh와 auth는 브라우저가 알아서 만들어주는 건가요?

**맞습니다.** `pushManager.subscribe()`를 호출하는 순간 브라우저가 자동으로 만듭니다.

우리 코드에서 이 부분:
```ts
const subscription = await registration.pushManager.subscribe({ ... })
const json = subscription.toJSON()
// json.keys.p256dh, json.keys.auth 가 여기서 나옴
```

브라우저가 내부적으로 하는 일:
```
pushManager.subscribe() 호출
    ↓
브라우저가 이 구독 전용 키 쌍을 새로 생성
    - p256dh : 브라우저의 공개키  (우리 서버에 줌 → DB에 저장)
    - auth   : 랜덤 비밀값        (우리 서버에 줌 → DB에 저장)
    - 브라우저의 비밀키 : 브라우저 내부에만 보관, 절대 밖으로 안 나옴
```

나중에 알림을 보낼 때 이 p256dh(브라우저 공개키)로 내용을 암호화해서 보내면,
**브라우저만이 자신의 비밀키로 내용을 복호화**할 수 있습니다.
Google 서버는 암호화된 덩어리만 전달할 뿐, 내용을 볼 수 없습니다.

정리하면:

| 키 | 누가 만드나 | 어디에 저장 | 용도 |
|---|---|---|---|
| p256dh | 브라우저 (자동) | 우리 DB + 브라우저 내부 | 메시지 암호화 |
| auth | 브라우저 (자동) | 우리 DB + 브라우저 내부 | 암호화 보조 |
| VAPID 공개키 | 우리가 생성 | `.env` | 구독 시 브라우저에 전달 |
| VAPID 비밀키 | 우리가 생성 | Supabase Secrets | 발송 시 서명 |

---

### Q4. Google 서버에 보낼 때 비밀키로 잠그면, Google이 공개키로 여는 건가요?

**반은 맞고, 반은 다릅니다.** 여기서 "잠근다"와 "연다"의 의미가 다릅니다.

암호에는 두 가지 방향이 있습니다:

**① 암호화 (잠금)**: 공개키로 잠금 → 비밀키로만 열 수 있음
> "나만 읽을 수 있게" → 받는 사람의 공개키로 잠금

**② 서명 (도장)**: 비밀키로 서명 → 공개키로 검증
> "내가 보낸 게 맞다는 증명" → 내 비밀키로 서명

VAPID는 **②번, 서명**입니다. "잠금"이 아니라 "도장 찍기"입니다.

실제 흐름:

```
우리 서버가 발송 요청을 보낼 때
    ↓
VAPID 비밀키로 "이 요청은 우리 서버가 보낸 것" 이라는 서명(JWT)을 생성
    ↓
서명을 요청 헤더에 붙여서 Google 서버로 전송
    ↓
Google 서버가 우리 VAPID 공개키로 서명을 검증
"이 서명이 BGM5GFBP... 공개키에 대응하는 비밀키로 만들어진 게 맞네. 신뢰할 수 있는 발신자다."
    ↓
Google이 알림을 브라우저로 전달
```

> 비유하자면: 공무원이 문서에 직인(비밀키)을 찍고, 상대방이 인감증명서(공개키)로 "이 직인이 진짜인지" 확인하는 것입니다.
> 내용을 숨기는 게 아니라, **발신자가 진짜임을 증명**하는 것입니다.

**전체 암호화 구조를 한눈에 보면:**

```
[우리 서버]  → Google 서버 전달용 →  [Google 서버]  → 브라우저 전달 →  [브라우저]

VAPID 비밀키로 "서명"          Google이 VAPID 공개키로 "검증"
                                            ↓
                               p256dh(브라우저 공개키)로 내용 "암호화"
                                            ↓
                                                          브라우저가 자신의 비밀키로 "복호화"
```

두 가지 암호 작업이 **각각 다른 키 쌍**으로 이루어집니다:
- **VAPID 키쌍**: Google에게 "우리가 보낸 것"임을 증명 (서명/검증)
- **p256dh 키쌍**: Google이 내용을 못 읽게 암호화 (암호화/복호화)
