import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import type {
    LocalParticipant,
    LocalTrackPublication,
    RemoteParticipant,
    RemoteTrackPublication,
} from 'livekit-client';
import { Track } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { getBrowser, getOS } from '@proton/shared/lib/helpers/browser';
import useFlag from '@proton/unleash/useFlag';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';

import './DebugOverlay.scss';

const downloadJson = (data: object, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getBrowserInfo = (): string => {
    const browser = getBrowser();
    return `${browser.name || 'Unknown'} ${browser.version || ''}`.trim();
};

const getOSInfo = (): string => {
    const os = getOS();
    return `${os.name || 'Unknown'} ${os.version || ''}`.trim();
};

interface WebRTCStats {
    // Codec info
    codec?: string;

    // Inbound RTP stats (receiving)
    packetsReceived?: number;
    packetsLost?: number;
    jitter?: number;
    bytesReceived?: number;
    lastPacketReceivedTimestamp?: number;
    packetsDiscarded?: number;

    // Video decode stats
    framesDecoded?: number;
    framesDropped?: number;
    framesReceived?: number;
    keyFramesDecoded?: number;
    freezeCount?: number;
    totalFreezesDuration?: number;
    pauseCount?: number;
    totalPausesDuration?: number;
    pliCount?: number;
    firCount?: number;

    // Audio stats
    concealedSamples?: number;
    concealmentEvents?: number;
    totalSamplesReceived?: number;
    silentConcealedSamples?: number;
    totalAudioEnergy?: number;
    estimatedPlayoutTimestamp?: number;

    // Jitter buffer stats
    jitterBufferDelay?: number;
    jitterBufferEmittedCount?: number;
    jitterBufferMinimumDelay?: number;
    jitterBufferTargetDelay?: number;

    // Outbound RTP stats (sending)
    packetsSent?: number;
    bytesSent?: number;
    retransmittedPacketsSent?: number;
    nackCount?: number;
    lastPacketSentTimestamp?: number;
    totalPacketSendDelay?: number;

    // Video encode stats
    framesEncoded?: number;
    keyFramesEncoded?: number;
    framesPerSecond?: number;
    frameWidth?: number;
    frameHeight?: number;
    qualityLimitationReason?: string;
    qualityLimitationDurations?: Record<string, number>;

    // Remote inbound RTP stats (feedback from receiver)
    remotePacketsLost?: number;
    remoteFractionLost?: number;
    remoteRoundTripTime?: number;
    remoteJitter?: number;

    // Connection stats (candidate-pair)
    roundTripTime?: number;
    totalRoundTripTime?: number;
    roundTripTimeMeasurements?: number;
    availableOutgoingBitrate?: number;
    availableIncomingBitrate?: number;
    candidatePairState?: string;
    candidatePairBytesReceived?: number;
    candidatePairBytesSent?: number;
    requestsReceived?: number;
    requestsSent?: number;
    responsesReceived?: number;
    responsesSent?: number;
    consentRequestsSent?: number;
    candidatePairLastPacketReceivedTimestamp?: number;
    candidatePairLastPacketSentTimestamp?: number;

    // Transport stats
    dtlsState?: string;
    iceState?: string;
    selectedCandidatePairChanges?: number;
}

interface PublicationInfo {
    trackSid: string;
    trackName: string;
    kind: string;
    source: string;
    muted: boolean;
    subscribed?: boolean;
    enabled?: boolean;
    simulcasted?: boolean;
}

interface PublicationWithStats extends PublicationInfo {
    webrtcStats?: WebRTCStats;
}

interface ParticipantDebugInfo {
    identity: string;
    name: string;
    publications: PublicationInfo[];
    isLocal: boolean;
    connectionQuality?: string;
}

interface ParticipantReportInfo {
    identity: string;
    publications: PublicationWithStats[];
    connectionQuality?: string;
}

interface LocalParticipantDebugInfo extends ParticipantDebugInfo {
    selectedCamera: string;
    selectedMicrophone: string;
    selectedSpeaker: string;
    isCameraActive: boolean;
    isMicrophoneActive: boolean;
    availableCameras: { deviceId: string; label: string }[];
    availableMicrophones: { deviceId: string; label: string }[];
    availableSpeakers: { deviceId: string; label: string }[];
}

interface LocalParticipantReportInfo extends ParticipantReportInfo {
    selectedCameraId: string;
    selectedCameraLabel: string;
    selectedMicrophoneId: string;
    selectedMicrophoneLabel: string;
    selectedSpeakerId: string;
    selectedSpeakerLabel: string;
    isCameraActive: boolean;
    isMicrophoneActive: boolean;
    availableCameras: { deviceId: string; label: string }[];
    availableMicrophones: { deviceId: string; label: string }[];
    availableSpeakers: { deviceId: string; label: string }[];
    browser: string;
    os: string;
}

const getBasicPublicationInfo = (pub: LocalTrackPublication | RemoteTrackPublication): PublicationInfo => {
    const info: PublicationInfo = {
        trackSid: pub.trackSid || 'N/A',
        trackName: pub.trackName || 'N/A',
        kind: pub.kind || 'N/A',
        source: pub.source || 'N/A',
        muted: pub.isMuted,
        simulcasted: pub.simulcasted,
    };

    if ('isSubscribed' in pub) {
        info.subscribed = (pub as RemoteTrackPublication).isSubscribed;
        info.enabled = (pub as RemoteTrackPublication).isEnabled;
    }

    return info;
};

const getWebRTCStats = async (pub: LocalTrackPublication | RemoteTrackPublication): Promise<WebRTCStats | null> => {
    if (!pub.track) {
        return null;
    }

    const stats: WebRTCStats = {};

    try {
        const rtcStats = await pub.track.getRTCStatsReport();
        if (rtcStats) {
            rtcStats.forEach((report) => {
                // Inbound RTP stats (receiving remote tracks)
                if (report.type === 'inbound-rtp') {
                    stats.packetsReceived = report.packetsReceived;
                    stats.packetsLost = report.packetsLost;
                    stats.jitter = report.jitter;
                    stats.bytesReceived = report.bytesReceived;
                    stats.lastPacketReceivedTimestamp = report.lastPacketReceivedTimestamp;
                    stats.packetsDiscarded = report.packetsDiscarded;
                    stats.framesDecoded = report.framesDecoded;
                    stats.framesDropped = report.framesDropped;
                    stats.framesReceived = report.framesReceived;
                    stats.keyFramesDecoded = report.keyFramesDecoded;
                    stats.freezeCount = report.freezeCount;
                    stats.totalFreezesDuration = report.totalFreezesDuration;
                    stats.pauseCount = report.pauseCount;
                    stats.totalPausesDuration = report.totalPausesDuration;
                    stats.pliCount = report.pliCount;
                    stats.firCount = report.firCount;
                    stats.framesPerSecond = report.framesPerSecond;
                    stats.frameWidth = report.frameWidth;
                    stats.frameHeight = report.frameHeight;
                    stats.nackCount = report.nackCount;
                    stats.concealedSamples = report.concealedSamples;
                    stats.concealmentEvents = report.concealmentEvents;
                    stats.totalSamplesReceived = report.totalSamplesReceived;
                    stats.silentConcealedSamples = report.silentConcealedSamples;
                    stats.totalAudioEnergy = report.totalAudioEnergy;
                    stats.estimatedPlayoutTimestamp = report.estimatedPlayoutTimestamp;
                    stats.jitterBufferDelay = report.jitterBufferDelay;
                    stats.jitterBufferEmittedCount = report.jitterBufferEmittedCount;
                    stats.jitterBufferMinimumDelay = report.jitterBufferMinimumDelay;
                    stats.jitterBufferTargetDelay = report.jitterBufferTargetDelay;
                }

                // Outbound RTP stats (sending local tracks)
                if (report.type === 'outbound-rtp') {
                    stats.packetsSent = report.packetsSent;
                    stats.bytesSent = report.bytesSent;
                    stats.retransmittedPacketsSent = report.retransmittedPacketsSent;
                    stats.nackCount = report.nackCount;
                    stats.lastPacketSentTimestamp = report.lastPacketSentTimestamp;
                    stats.totalPacketSendDelay = report.totalPacketSendDelay;
                    stats.framesEncoded = report.framesEncoded;
                    stats.keyFramesEncoded = report.keyFramesEncoded;
                    stats.framesPerSecond = report.framesPerSecond;
                    stats.frameWidth = report.frameWidth;
                    stats.frameHeight = report.frameHeight;
                    stats.qualityLimitationReason = report.qualityLimitationReason;
                    stats.qualityLimitationDurations = report.qualityLimitationDurations;
                    stats.pliCount = report.pliCount;
                    stats.firCount = report.firCount;
                }

                // Remote inbound RTP stats (feedback from receiver about what we're sending)
                if (report.type === 'remote-inbound-rtp') {
                    stats.remotePacketsLost = report.packetsLost;
                    stats.remoteFractionLost = report.fractionLost;
                    stats.remoteRoundTripTime = report.roundTripTime;
                    stats.remoteJitter = report.jitter;
                }

                // Connection stats from successful candidate pair
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    stats.candidatePairState = report.state;
                    stats.roundTripTime = report.currentRoundTripTime;
                    stats.totalRoundTripTime = report.totalRoundTripTime;
                    stats.roundTripTimeMeasurements = report.roundTripTimeMeasurements;
                    stats.availableOutgoingBitrate = report.availableOutgoingBitrate;
                    stats.availableIncomingBitrate = report.availableIncomingBitrate;
                    stats.candidatePairBytesReceived = report.bytesReceived;
                    stats.candidatePairBytesSent = report.bytesSent;
                    stats.requestsReceived = report.requestsReceived;
                    stats.requestsSent = report.requestsSent;
                    stats.responsesReceived = report.responsesReceived;
                    stats.responsesSent = report.responsesSent;
                    stats.consentRequestsSent = report.consentRequestsSent;
                    stats.candidatePairLastPacketReceivedTimestamp = report.lastPacketReceivedTimestamp;
                    stats.candidatePairLastPacketSentTimestamp = report.lastPacketSentTimestamp;
                }

                // Transport stats
                if (report.type === 'transport') {
                    stats.dtlsState = report.dtlsState;
                    stats.iceState = report.iceState;
                    stats.selectedCandidatePairChanges = report.selectedCandidatePairChanges;
                }

                // Codec info
                if (report.type === 'codec') {
                    stats.codec = report.mimeType;
                }
            });
        }
    } catch {
        // Stats collection failed, continue without them
    }

    // Only return stats if we collected something
    return Object.keys(stats).length > 0 ? stats : null;
};

const getPublicationWithStats = async (
    pub: LocalTrackPublication | RemoteTrackPublication
): Promise<PublicationWithStats> => {
    const info = getBasicPublicationInfo(pub);
    const webrtcStats = await getWebRTCStats(pub);

    return {
        ...info,
        ...(webrtcStats && { webrtcStats }),
    };
};

const getLocalParticipantDebugInfo = (
    localParticipant: LocalParticipant,
    selectedCameraId: string,
    selectedMicrophoneId: string,
    selectedSpeakerId: string,
    isCameraActive: boolean,
    isMicrophoneActive: boolean,
    cameras: MediaDeviceInfo[],
    microphones: MediaDeviceInfo[],
    speakers: MediaDeviceInfo[]
): LocalParticipantDebugInfo => {
    const publications: PublicationInfo[] = [];

    for (const pub of localParticipant.trackPublications.values()) {
        publications.push(getBasicPublicationInfo(pub));
    }

    return {
        identity: localParticipant.identity,
        name: localParticipant.name || 'Unknown',
        isLocal: true,
        selectedCamera: cameras.find((c) => c.deviceId === selectedCameraId)?.label || selectedCameraId,
        selectedMicrophone: microphones.find((m) => m.deviceId === selectedMicrophoneId)?.label || selectedMicrophoneId,
        selectedSpeaker: speakers.find((s) => s.deviceId === selectedSpeakerId)?.label || selectedSpeakerId,
        isCameraActive,
        isMicrophoneActive,
        availableCameras: cameras.map((c) => ({ deviceId: c.deviceId, label: c.label })),
        availableMicrophones: microphones.map((m) => ({ deviceId: m.deviceId, label: m.label })),
        availableSpeakers: speakers.map((s) => ({ deviceId: s.deviceId, label: s.label })),
        publications,
        connectionQuality: localParticipant.connectionQuality,
    };
};

const getRemoteParticipantDebugInfo = (participant: RemoteParticipant): ParticipantDebugInfo => {
    const publications: PublicationInfo[] = [];

    for (const pub of participant.trackPublications.values()) {
        publications.push(getBasicPublicationInfo(pub));
    }

    return {
        identity: participant.identity,
        name: participant.name || 'Unknown',
        isLocal: false,
        publications,
        connectionQuality: participant.connectionQuality,
    };
};

// Report functions - these exclude names and include WebRTC stats embedded in each publication

const getLocalParticipantReportInfo = async (
    localParticipant: LocalParticipant,
    selectedCameraId: string,
    selectedMicrophoneId: string,
    selectedSpeakerId: string,
    isCameraActive: boolean,
    isMicrophoneActive: boolean,
    cameras: MediaDeviceInfo[],
    microphones: MediaDeviceInfo[],
    speakers: MediaDeviceInfo[]
): Promise<LocalParticipantReportInfo> => {
    const publications: PublicationWithStats[] = [];

    for (const pub of localParticipant.trackPublications.values()) {
        const pubWithStats = await getPublicationWithStats(pub);
        publications.push(pubWithStats);
    }

    return {
        identity: localParticipant.identity,
        selectedCameraId,
        selectedCameraLabel: cameras.find((c) => c.deviceId === selectedCameraId)?.label || '',
        selectedMicrophoneId,
        selectedMicrophoneLabel: microphones.find((m) => m.deviceId === selectedMicrophoneId)?.label || '',
        selectedSpeakerId,
        selectedSpeakerLabel: speakers.find((s) => s.deviceId === selectedSpeakerId)?.label || '',
        isCameraActive,
        isMicrophoneActive,
        availableCameras: cameras.map((c) => ({ deviceId: c.deviceId, label: c.label })),
        availableMicrophones: microphones.map((m) => ({ deviceId: m.deviceId, label: m.label })),
        availableSpeakers: speakers.map((s) => ({ deviceId: s.deviceId, label: s.label })),
        publications,
        connectionQuality: localParticipant.connectionQuality,
        browser: getBrowserInfo(),
        os: getOSInfo(),
    };
};

const getRemoteParticipantReportInfo = async (participant: RemoteParticipant): Promise<ParticipantReportInfo> => {
    const publications: PublicationWithStats[] = [];

    for (const pub of participant.trackPublications.values()) {
        const pubWithStats = await getPublicationWithStats(pub);
        publications.push(pubWithStats);
    }

    return {
        identity: participant.identity,
        publications,
        connectionQuality: participant.connectionQuality,
    };
};

interface DebugOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TrackStatsSnapshot {
    timestamp: string;
    stats: WebRTCStats;
}

interface TrackRecording {
    trackSid: string;
    trackName: string;
    kind: string;
    source: string;
    snapshots: TrackStatsSnapshot[];
}

export const DebugOverlay = ({ isOpen, onClose }: DebugOverlayProps) => {
    const room = useRoomContext();
    const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
    const remoteParticipants = useRemoteParticipants();
    const { roomName, participantNameMap } = useMeetContext();
    const { cameras, microphones, speakers, selectedCameraId, selectedMicrophoneId, selectedAudioOutputDeviceId } =
        useMediaManagementContext();

    const [localInfo, setLocalInfo] = useState<LocalParticipantDebugInfo | null>(null);
    const [remoteInfos, setRemoteInfos] = useState<ParticipantDebugInfo[]>([]);
    const [recordingParticipantIdentity, setRecordingParticipantIdentity] = useState<string | null>(null);
    const [trackRecordings, setTrackRecordings] = useState<Map<string, TrackRecording>>(new Map());
    const isCapturing = useRef(false);

    // Update debug info periodically
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const updateInfo = () => {
            if (localParticipant) {
                const info = getLocalParticipantDebugInfo(
                    localParticipant,
                    selectedCameraId,
                    selectedMicrophoneId,
                    selectedAudioOutputDeviceId,
                    isCameraEnabled,
                    isMicrophoneEnabled,
                    cameras,
                    microphones,
                    speakers
                );
                setLocalInfo(info);
            }

            // Sort remote participants - ones with active tracks come first
            const sortedRemote = [...remoteParticipants].sort((a, b) => {
                const aHasActiveTracks = [...a.trackPublications.values()].some(
                    (pub) =>
                        !pub.isMuted && (pub.source === Track.Source.Camera || pub.source === Track.Source.Microphone)
                );
                const bHasActiveTracks = [...b.trackPublications.values()].some(
                    (pub) =>
                        !pub.isMuted && (pub.source === Track.Source.Camera || pub.source === Track.Source.Microphone)
                );
                if (aHasActiveTracks && !bHasActiveTracks) {
                    return -1;
                }
                if (!aHasActiveTracks && bHasActiveTracks) {
                    return 1;
                }
                return 0;
            });

            const infos = sortedRemote.map(getRemoteParticipantDebugInfo);
            setRemoteInfos(infos);
        };

        updateInfo();
        const interval = setInterval(updateInfo, 1000);

        return () => clearInterval(interval);
    }, [
        isOpen,
        localParticipant,
        remoteParticipants,
        cameras,
        microphones,
        speakers,
        selectedCameraId,
        selectedMicrophoneId,
        selectedAudioOutputDeviceId,
        isCameraEnabled,
        isMicrophoneEnabled,
    ]);

    // Record stats snapshots for each track separately
    useEffect(() => {
        if (!isOpen || !recordingParticipantIdentity) {
            return;
        }

        const captureSnapshots = async () => {
            if (isCapturing.current) {
                // avoid duplicate capture
                return;
            }
            isCapturing.current = true;

            try {
                const timestamp = new Date().toISOString();
                const participant = remoteParticipants.find((p) => p.identity === recordingParticipantIdentity);

                if (participant) {
                    // Capture stats for each track
                    for (const pub of participant.trackPublications.values()) {
                        const webrtcStats = await getWebRTCStats(pub);

                        if (webrtcStats) {
                            const trackSnapshot: TrackStatsSnapshot = {
                                timestamp,
                                stats: webrtcStats,
                            };

                            setTrackRecordings((prev) => {
                                const updated = new Map(prev);
                                let trackRecording = updated.get(pub.trackSid);

                                if (!trackRecording) {
                                    // Initialize new track recording
                                    trackRecording = {
                                        trackSid: pub.trackSid || 'N/A',
                                        trackName: pub.trackName || 'N/A',
                                        kind: pub.kind || 'N/A',
                                        source: pub.source || 'N/A',
                                        snapshots: [],
                                    };
                                }

                                trackRecording.snapshots.push(trackSnapshot);
                                updated.set(pub.trackSid, trackRecording);
                                return updated;
                            });
                        }
                    }
                }
            } finally {
                isCapturing.current = false;
            }
        };

        void captureSnapshots();
        const interval = setInterval(() => {
            void captureSnapshots();
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, recordingParticipantIdentity, remoteParticipants]);

    // Clean up recording if participant left
    useEffect(() => {
        if (recordingParticipantIdentity) {
            const participantStillPresent = remoteParticipants.some((p) => p.identity === recordingParticipantIdentity);

            if (!participantStillPresent) {
                setRecordingParticipantIdentity(null);
                setTrackRecordings(new Map());
            }
        }
    }, [remoteParticipants, recordingParticipantIdentity]);

    const stopAndDownloadRecording = useCallback(
        async (participantIdentity: string, recordings: Map<string, TrackRecording>) => {
            const participant = remoteParticipants.find((p) => p.identity === participantIdentity);
            if (participant && recordings.size > 0) {
                const participantReportInfo = await getRemoteParticipantReportInfo(participant);

                const report = {
                    roomName: room.name,
                    timestamp: new Date().toISOString(),
                    participantIdentity: participant.identity,
                    participantInfo: participantReportInfo,
                    trackRecordings: Array.from(recordings.values()),
                };

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                downloadJson(report, `remote-participant-recording-${timestamp}.json`);
            }
        },
        [remoteParticipants, room.name]
    );

    // Auto-stop recording after 15 seconds
    useEffect(() => {
        if (recordingParticipantIdentity && trackRecordings.size > 0) {
            // Check if any track has reached 15 snapshots
            const maxSnapshots = Math.max(...Array.from(trackRecordings.values()).map((tr) => tr.snapshots.length));
            if (maxSnapshots >= 15) {
                // Immediately clear the recording state to prevent double download
                const recordingsToSave = new Map(trackRecordings);
                const participantToSave = recordingParticipantIdentity;
                setRecordingParticipantIdentity(null);
                setTrackRecordings(new Map());

                // Then download asynchronously
                void stopAndDownloadRecording(participantToSave, recordingsToSave);
            }
        }
    }, [trackRecordings, recordingParticipantIdentity, stopAndDownloadRecording]);

    const handleReportMeetingIssue = useCallback(async () => {
        const localReportInfo = await getLocalParticipantReportInfo(
            localParticipant,
            selectedCameraId,
            selectedMicrophoneId,
            selectedAudioOutputDeviceId,
            isCameraEnabled,
            isMicrophoneEnabled,
            cameras,
            microphones,
            speakers
        );

        const remoteReportInfos: ParticipantReportInfo[] = [];
        for (const participant of remoteParticipants) {
            const info = await getRemoteParticipantReportInfo(participant);
            remoteReportInfos.push(info);
        }

        const report = {
            roomName: room.name,
            timestamp: new Date().toISOString(),
            localParticipant: localReportInfo,
            remoteParticipants: remoteReportInfos,
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadJson(report, `meeting-report-${timestamp}.json`);
    }, [
        localParticipant,
        remoteParticipants,
        room.name,
        selectedCameraId,
        selectedMicrophoneId,
        selectedAudioOutputDeviceId,
        isCameraEnabled,
        isMicrophoneEnabled,
        cameras,
        microphones,
        speakers,
    ]);

    const handleReportLocalIssue = useCallback(async () => {
        const localReportInfo = await getLocalParticipantReportInfo(
            localParticipant,
            selectedCameraId,
            selectedMicrophoneId,
            selectedAudioOutputDeviceId,
            isCameraEnabled,
            isMicrophoneEnabled,
            cameras,
            microphones,
            speakers
        );

        const report = {
            roomName: room.name,
            timestamp: new Date().toISOString(),
            localParticipant: localReportInfo,
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadJson(report, `local-participant-report-${timestamp}.json`);
    }, [
        localParticipant,
        room.name,
        selectedCameraId,
        selectedMicrophoneId,
        selectedAudioOutputDeviceId,
        isCameraEnabled,
        isMicrophoneEnabled,
        cameras,
        microphones,
        speakers,
    ]);

    const handleReportParticipantIssue = useCallback(
        async (participant: RemoteParticipant) => {
            const participantReportInfo = await getRemoteParticipantReportInfo(participant);

            const report = {
                roomName: room.name,
                timestamp: new Date().toISOString(),
                participant: participantReportInfo,
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadJson(report, `remote-participant-report-${timestamp}.json`);
        },
        [room.name]
    );

    const handleToggleRecording = useCallback(
        async (participantIdentity: string) => {
            if (recordingParticipantIdentity === participantIdentity) {
                // Stop recording and download
                const recordingsToSave = new Map(trackRecordings);
                setRecordingParticipantIdentity(null);
                setTrackRecordings(new Map());
                await stopAndDownloadRecording(participantIdentity, recordingsToSave);
            } else {
                // Start recording this participant (stop any other recording)
                setRecordingParticipantIdentity(participantIdentity);
                setTrackRecordings(new Map());
            }
        },
        [recordingParticipantIdentity, trackRecordings, stopAndDownloadRecording]
    );

    if (!isOpen) {
        return null;
    }

    const getParticipantDisplayName = (identity: string, name: string) => {
        return participantNameMap[identity] || name || identity;
    };

    return (
        <div className="debug-overlay">
            <div className="debug-overlay-content">
                <div className="debug-overlay-header">
                    <h2 className="debug-overlay-title">
                        {c('Title').t`Debug Overlay`}
                        {roomName && <span className="debug-room-name"> - {roomName}</span>}
                    </h2>
                    <div className="debug-header-actions">
                        <Button size="small" onClick={handleReportMeetingIssue}>
                            {c('Action').t`Download room level report`}
                        </Button>
                        <Button icon shape="ghost" size="small" onClick={onClose} className="debug-close-button">
                            <IcCross size={4} />
                        </Button>
                    </div>
                </div>

                <div className="debug-overlay-body">
                    {/* Local Participant Section */}
                    {localInfo && (
                        <div className="debug-section">
                            <div className="debug-section-header">
                                <h3>{c('Title').t`Local Participant`}</h3>
                                <Button size="small" shape="outline" onClick={handleReportLocalIssue}>
                                    {c('Action').t`Download local participant report`}
                                </Button>
                            </div>
                            <div className="debug-participant-info">
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Name`}:</span>
                                    <span>{getParticipantDisplayName(localInfo.identity, localInfo.name)}</span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Identity`}:</span>
                                    <span className="debug-monospace">{localInfo.identity}</span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Connection Quality`}:</span>
                                    <span>{localInfo.connectionQuality || 'N/A'}</span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Camera Active`}:</span>
                                    <span className={localInfo.isCameraActive ? 'debug-status-on' : 'debug-status-off'}>
                                        {localInfo.isCameraActive ? c('Status').t`Yes` : c('Status').t`No`}
                                    </span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Microphone Active`}:</span>
                                    <span
                                        className={
                                            localInfo.isMicrophoneActive ? 'debug-status-on' : 'debug-status-off'
                                        }
                                    >
                                        {localInfo.isMicrophoneActive ? c('Status').t`Yes` : c('Status').t`No`}
                                    </span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Selected Camera`}:</span>
                                    <span>{localInfo.selectedCamera}</span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Selected Microphone`}:</span>
                                    <span>{localInfo.selectedMicrophone}</span>
                                </div>
                                <div className="debug-info-row">
                                    <span className="debug-label">{c('Label').t`Selected Speaker`}:</span>
                                    <span>{localInfo.selectedSpeaker}</span>
                                </div>

                                <div className="debug-subsection">
                                    <h4>{c('Title').t`Available Cameras`}</h4>
                                    <ul className="debug-device-list">
                                        {localInfo.availableCameras.map((cam) => (
                                            <li key={cam.deviceId}>{cam.label || cam.deviceId}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="debug-subsection">
                                    <h4>{c('Title').t`Available Microphones`}</h4>
                                    <ul className="debug-device-list">
                                        {localInfo.availableMicrophones.map((mic) => (
                                            <li key={mic.deviceId}>{mic.label || mic.deviceId}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="debug-subsection">
                                    <h4>{c('Title').t`Available Speakers`}</h4>
                                    <ul className="debug-device-list">
                                        {localInfo.availableSpeakers.map((speaker) => (
                                            <li key={speaker.deviceId}>{speaker.label || speaker.deviceId}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="debug-subsection">
                                    <h4>{c('Title').t`Publications`}</h4>
                                    {localInfo.publications.length === 0 ? (
                                        <p className="debug-empty">{c('Info').t`No publications`}</p>
                                    ) : (
                                        <div className="debug-publications">
                                            {localInfo.publications.map((pub) => (
                                                <div key={pub.trackSid} className="debug-publication">
                                                    <div className="debug-pub-header">
                                                        <span>
                                                            {pub.source} ({pub.kind})
                                                        </span>
                                                    </div>
                                                    <div className="debug-pub-row">
                                                        <span className="debug-label">{c('Label').t`Muted`}:</span>
                                                        <span
                                                            className={
                                                                pub.muted ? 'debug-status-off' : 'debug-status-on'
                                                            }
                                                        >
                                                            {pub.muted ? c('Status').t`Yes` : c('Status').t`No`}
                                                        </span>
                                                    </div>
                                                    <div className="debug-pub-row">
                                                        <span className="debug-label">{c('Label').t`Track SID`}:</span>
                                                        <span className="debug-monospace">{pub.trackSid}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remote Participants Section */}
                    <div className="debug-section">
                        <h3>
                            {c('Title').t`Remote Participants`} ({remoteInfos.length})
                        </h3>
                        {remoteInfos.length === 0 ? (
                            <p className="debug-empty">{c('Info').t`No remote participants`}</p>
                        ) : (
                            <div className="debug-remote-participants">
                                {remoteInfos.map((info) => {
                                    const participant = remoteParticipants.find((p) => p.identity === info.identity);
                                    const hasActiveTracks = info.publications.some(
                                        (pub) => !pub.muted && (pub.source === 'camera' || pub.source === 'microphone')
                                    );

                                    return (
                                        <div
                                            key={info.identity}
                                            className={`debug-participant ${hasActiveTracks ? 'debug-participant-active' : ''}`}
                                        >
                                            <div className="debug-participant-header">
                                                <span className="debug-participant-name">
                                                    {getParticipantDisplayName(info.identity, info.name)}
                                                    {hasActiveTracks && (
                                                        <span className="debug-active-badge">{c('Badge')
                                                            .t`Active`}</span>
                                                    )}
                                                </span>
                                                {participant && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <Button
                                                            size="small"
                                                            shape="outline"
                                                            color={
                                                                recordingParticipantIdentity === info.identity
                                                                    ? 'danger'
                                                                    : 'norm'
                                                            }
                                                            onClick={() => handleToggleRecording(info.identity)}
                                                        >
                                                            {recordingParticipantIdentity === info.identity
                                                                ? c('Action').t`Stop Recording Track Stats`
                                                                : c('Action').t`Start Recording Track Stats`}
                                                            {recordingParticipantIdentity === info.identity &&
                                                                trackRecordings.size > 0 &&
                                                                (() => {
                                                                    const maxSnapshots = Math.max(
                                                                        ...Array.from(trackRecordings.values()).map(
                                                                            (tr) => tr.snapshots.length
                                                                        )
                                                                    );
                                                                    return (
                                                                        <span style={{ marginLeft: '4px' }}>
                                                                            ({maxSnapshots}/15s)
                                                                        </span>
                                                                    );
                                                                })()}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            shape="outline"
                                                            onClick={() => handleReportParticipantIssue(participant)}
                                                        >
                                                            {c('Action').t`Download participant report`}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="debug-info-row">
                                                <span className="debug-label">{c('Label').t`Identity`}:</span>
                                                <span className="debug-monospace">{info.identity}</span>
                                            </div>
                                            <div className="debug-info-row">
                                                <span className="debug-label">{c('Label').t`Connection Quality`}:</span>
                                                <span>{info.connectionQuality || 'N/A'}</span>
                                            </div>

                                            {info.publications.length > 0 && (
                                                <div className="debug-subsection">
                                                    <h4>{c('Title').t`Publications`}</h4>
                                                    <div className="debug-publications">
                                                        {info.publications.map((pub) => (
                                                            <div key={pub.trackSid} className="debug-publication">
                                                                <div className="debug-pub-header">
                                                                    <span>
                                                                        {pub.source} ({pub.kind})
                                                                    </span>
                                                                </div>
                                                                <div className="debug-pub-row">
                                                                    <span className="debug-label">
                                                                        {c('Label').t`Muted`}:
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            pub.muted
                                                                                ? 'debug-status-off'
                                                                                : 'debug-status-on'
                                                                        }
                                                                    >
                                                                        {pub.muted
                                                                            ? c('Status').t`Yes`
                                                                            : c('Status').t`No`}
                                                                    </span>
                                                                </div>
                                                                <div className="debug-pub-row">
                                                                    <span className="debug-label">
                                                                        {c('Label').t`Subscribed`}:
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            pub.subscribed
                                                                                ? 'debug-status-on'
                                                                                : 'debug-status-off'
                                                                        }
                                                                    >
                                                                        {pub.subscribed
                                                                            ? c('Status').t`Yes`
                                                                            : c('Status').t`No`}
                                                                    </span>
                                                                </div>
                                                                <div className="debug-pub-row">
                                                                    <span className="debug-label">
                                                                        {c('Label').t`Enabled`}:
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            pub.enabled
                                                                                ? 'debug-status-on'
                                                                                : 'debug-status-off'
                                                                        }
                                                                    >
                                                                        {pub.enabled
                                                                            ? c('Status').t`Yes`
                                                                            : c('Status').t`No`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const useDebugOverlay = () => {
    const isDebugModeEnabled = useFlag('MeetDebugMode');
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => {
        if (isDebugModeEnabled) {
            setIsOpen((prev) => !prev);
        }
    }, [isDebugModeEnabled]);

    const open = useCallback(() => {
        if (isDebugModeEnabled) {
            setIsOpen(true);
        }
    }, [isDebugModeEnabled]);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Keyboard shortcut: Ctrl+Shift+D
    useEffect(() => {
        if (!isDebugModeEnabled) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                toggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDebugModeEnabled, toggle]);

    return {
        isOpen,
        isEnabled: isDebugModeEnabled,
        toggle,
        open,
        close,
    };
};
