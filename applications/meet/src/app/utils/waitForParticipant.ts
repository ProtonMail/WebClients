import type { MeetStore } from '@proton/meet/store/store';
import type { ParticipantEntity } from '@proton/meet/types/types';

export const waitForParticipant = (
    store: MeetStore,
    identity: string,
    timeoutMs = 10_000
): Promise<ParticipantEntity | undefined> => {
    const current = store.getState().participants.participantsMap[identity];
    if (current) {
        return Promise.resolve(current);
    }

    return new Promise((resolve) => {
        let timeout: NodeJS.Timeout;

        const unsubscribe = store.subscribe(() => {
            const participant = store.getState().participants.participantsMap[identity];
            if (participant) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(participant);
            }
        });

        timeout = setTimeout(() => {
            unsubscribe();
            resolve(undefined);
        }, timeoutMs);
    });
};
