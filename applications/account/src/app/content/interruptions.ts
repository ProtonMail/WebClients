import type { AuthInterruption, AuthSession } from './authSession';

export const hasInterruption = (session: AuthSession, interruption: AuthInterruption) => {
    return session.interruptions?.includes(interruption) ?? false;
};

export const withInterruption = (session: AuthSession, interruption: AuthInterruption): AuthSession => {
    return {
        ...session,
        interruptions: [...(session.interruptions ?? []), interruption],
    };
};
