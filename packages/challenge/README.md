# @proton/challenge

Embeds the anti-abuse challenge iframe (v5) and forwards form interactions to it. The frame observes how a form is filled in and produces a token to send with the form's request.

No dependency on `@proton/shared` or UI packages, by design.

## Usage

Render `Challenge` anywhere and point `observeRef` at the input to watch:

```tsx
const usernameRef = useRef<HTMLInputElement>(null);
const challengeRef = useRef<ChallengeRef>();

<InputFieldTwo ref={usernameRef} id="username" value={username} onValue={setUsername} />
<Challenge challengeRef={challengeRef} observeRef={usernameRef} getSrc={getSrc} onError={onError} />

// On submit:
const payload = await challengeRef.current?.getChallenge();
```