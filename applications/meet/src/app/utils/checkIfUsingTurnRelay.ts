import type { Room } from 'livekit-client';

interface RTCIceCandidate {
    id: string;
    candidateType: 'host' | 'srflx' | 'prflx' | 'relay';
    protocol?: 'udp' | 'tcp';
}

interface RTCCandidatePair {
    localCandidateId: string;
    remoteCandidateId: string;
}

export interface IceCandidateInfo {
    localCandidateType?: 'host' | 'srflx' | 'relay' | 'prflx';
    remoteCandidateType?: 'host' | 'srflx' | 'relay' | 'prflx';
    localCandidateProtocol?: 'udp' | 'tcp';
}

const readCandidates = (
    stats: RTCStatsReport
): { candidates: Map<string, RTCIceCandidate>; activePair: RTCCandidatePair | null } => {
    const candidates = new Map<string, RTCIceCandidate>();
    let activePair: RTCCandidatePair | null = null;

    stats.forEach((report) => {
        if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
            candidates.set(report.id, report as RTCIceCandidate);
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            activePair = report as RTCCandidatePair;
        }
    });

    return { candidates, activePair };
};

const getStatsReport = async (room: Room): Promise<RTCStatsReport | null> => {
    try {
        const pcManager = room.engine.pcManager as any;
        const publisherPC = pcManager.publisher?.pc;

        if (!publisherPC) {
            return null;
        }

        const statsPromise = publisherPC.getStats();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));

        return await Promise.race([statsPromise, timeoutPromise]);
    } catch {
        return null;
    }
};

export const checkIfUsingTurnRelay = async (room: Room): Promise<boolean> => {
    const stats = await getStatsReport(room);
    if (!stats) {
        return false;
    }

    const { candidates, activePair } = readCandidates(stats);
    if (!activePair) {
        return false;
    }

    const pair = activePair as RTCCandidatePair;
    const local = candidates.get(pair.localCandidateId);
    const remote = candidates.get(pair.remoteCandidateId);

    return local?.candidateType === 'relay' || remote?.candidateType === 'relay';
};

export const getIceCandidateInfo = async (room: Room): Promise<IceCandidateInfo> => {
    const stats = await getStatsReport(room);
    if (!stats) {
        return {};
    }

    const { candidates, activePair } = readCandidates(stats);
    if (!activePair) {
        return {};
    }

    const pair = activePair as RTCCandidatePair;
    const local = candidates.get(pair.localCandidateId);
    const remote = candidates.get(pair.remoteCandidateId);

    return {
        localCandidateType: local?.candidateType,
        remoteCandidateType: remote?.candidateType,
        localCandidateProtocol: local?.protocol,
    };
};
