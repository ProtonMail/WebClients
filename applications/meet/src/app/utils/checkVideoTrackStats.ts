import type { RemoteTrackPublication } from 'livekit-client';

interface VideoTrackStats {
    type: string;
    kind: string;
    framesReceived?: number;
    framesDecoded?: number;
    bytesReceived?: number;
}

export const checkVideoTrackStats = async (publication: RemoteTrackPublication) => {
    try {
        const stats = await publication.track!.getRTCStatsReport();
        if (!stats) {
            return null;
        }

        const videoReport = ([...stats.values()] as VideoTrackStats[]).find(
            (report: VideoTrackStats) => report.type === 'inbound-rtp' && report.kind === 'video'
        );

        if (!videoReport) {
            return null;
        }

        const framesReceived = typeof videoReport.framesReceived === 'number' ? videoReport.framesReceived : undefined;
        const framesDecoded = typeof videoReport.framesDecoded === 'number' ? videoReport.framesDecoded : undefined;
        const bytesReceived = typeof videoReport.bytesReceived === 'number' ? videoReport.bytesReceived : undefined;

        const chosenFrames = framesDecoded ?? framesReceived;

        return {
            currentValue: chosenFrames ?? bytesReceived ?? 0,
            isStuck: false,
            minExpectedDelta: chosenFrames !== undefined ? 1 : 5_000,
        };
    } catch {
        return null;
    }
};
