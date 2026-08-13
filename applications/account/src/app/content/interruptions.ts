import type { AuthInterruption, AuthSession } from '@proton/components/containers/login/interface';

export const hasInterruption = (session: AuthSession, interruption: AuthInterruption) => {
    return session.interruptions?.includes(interruption) ?? false;
};

export const withInterruption = (session: AuthSession, interruption: AuthInterruption): AuthSession => {
    return {
        ...session,
        interruptions: [...(session.interruptions ?? []), interruption],
    };
};
