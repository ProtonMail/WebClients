import type { KeyRotationLog, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';

import { getAgentDisplayInfo } from '../../utils/getAgentDisplayInfo';

interface ActivityEventRowBase {
    id: string;
    timestamp: number;
}

export type ActivityEventRow = ActivityEventRowBase &
    (
        | { kind: 'ownJoin' }
        | { kind: 'participantJoined'; name?: string }
        | { kind: 'participantLeft'; name?: string }
        | { kind: 'firstEpoch'; epoch: number }
        | { kind: 'epochChange'; previousEpoch: number; epoch: number }
        | { kind: 'epochError'; epoch: number }
    );

const getEpochRow = (log: KeyRotationLog, index: number, logs: KeyRotationLog[]): ActivityEventRow => {
    const base = { id: `epoch-${index}`, timestamp: log.timestamp };
    if (log.type === 'error') {
        return { ...base, kind: 'epochError', epoch: log.epoch };
    }
    if (index === 0) {
        return { ...base, kind: 'firstEpoch', epoch: log.epoch };
    }
    return { ...base, kind: 'epochChange', previousEpoch: logs[index - 1].epoch, epoch: log.epoch };
};

const getParticipantRows = (
    participantEvents: ParticipantEventRecord[],
    nameMap: Record<string, string>
): ActivityEventRow[] => {
    const unmatchedReplayedLeaveCountByReconnectAndIdentity = new Map<string, number>();
    const rows: ActivityEventRow[] = [];

    participantEvents.forEach((event, index) => {
        const isLeave = event.eventType === ParticipantEvent.Leave;

        if (event.localReconnectId !== undefined) {
            const key = `${event.localReconnectId}:${event.identity}`;
            const unmatchedReplayedLeaveCount = unmatchedReplayedLeaveCountByReconnectAndIdentity.get(key) ?? 0;
            if (isLeave) {
                unmatchedReplayedLeaveCountByReconnectAndIdentity.set(key, unmatchedReplayedLeaveCount + 1);
                return;
            }
            if (unmatchedReplayedLeaveCount > 0) {
                unmatchedReplayedLeaveCountByReconnectAndIdentity.set(key, unmatchedReplayedLeaveCount - 1);
                return;
            }
        }

        const name = event.isAgent ? getAgentDisplayInfo(event.identity).displayName : nameMap[event.identity];
        rows.push({
            id: `participant-${index}`,
            timestamp: event.timestamp,
            kind: isLeave ? 'participantLeft' : 'participantJoined',
            name: name || undefined,
        });
    });

    return rows;
};

export const getActivityEventRows = ({
    keyRotationLogs,
    participantEvents,
    nameMap,
}: {
    keyRotationLogs: KeyRotationLog[];
    participantEvents: ParticipantEventRecord[];
    nameMap: Record<string, string>;
}): ActivityEventRow[] => {
    const newestFirstRows = [...keyRotationLogs.map(getEpochRow), ...getParticipantRows(participantEvents, nameMap)]
        .map((row, insertionSequence) => ({ row, insertionSequence }))
        .sort(
            (first, second) =>
                second.row.timestamp - first.row.timestamp || second.insertionSequence - first.insertionSequence
        )
        .map(({ row }) => row);

    const firstLog = keyRotationLogs.at(0);
    if (!firstLog) {
        return newestFirstRows;
    }

    return [...newestFirstRows, { id: 'own-join', timestamp: firstLog.timestamp, kind: 'ownJoin' }];
};
