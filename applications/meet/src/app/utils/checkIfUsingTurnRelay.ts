import type { Room } from 'livekit-client';

interface RTCIceCandidate {
    id: string;
    candidateType: 'host' | 'srflx' | 'prflx' | 'relay';
}

interface RTCCandidatePair {
    localCandidateId: string;
    remoteCandidateId: string;
}

const checkStatsForRelay = (stats: RTCStatsReport): boolean => {
    const candidates = new Map<string, RTCIceCandidate>();
    let activePair: RTCCandidatePair | null = null;

    stats.forEach((report) => {
        if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
            candidates.set(report.id, report as RTCIceCandidate);
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            activePair = report as RTCCandidatePair;
        }
    });

    if (!activePair) {
        return false;
    }

    const pair = activePair as RTCCandidatePair;
    const local = candidates.get(pair.localCandidateId);
    const remote = candidates.get(pair.remoteCandidateId);

    return local?.candidateType === 'relay' || remote?.candidateType === 'relay';
};

export const checkIfUsingTurnRelay = async (room: Room): Promise<boolean> => {
    try {
        const pcManager = room.engine.pcManager as any;
        const publisherPC = pcManager.publisher?.pc;
        const subscriberPC = pcManager.subscriber?.pc;

        if (!publisherPC && !subscriberPC) {
            return false;
        }

        const statsPromise = (publisherPC || subscriberPC).getStats();
        const timeoutPromise = new Promise<RTCStatsReport | null>((resolve) => setTimeout(() => resolve(null), 1000));

        const stats = await Promise.race([statsPromise, timeoutPromise]);

        if (!stats) {
            return false;
        }

        return checkStatsForRelay(stats);
    } catch (error) {
        return false;
    }
};
