import type { KeyRotationLog, ParticipantEventRecord } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';

import { getActivityEventRows } from './getActivityEventRows';

const log = (timestamp: number, epoch: number, type: KeyRotationLog['type'] = 'log'): KeyRotationLog => ({
    timestamp,
    epoch,
    type,
    message: '',
});

const joined = (
    identity: string,
    timestamp: number,
    options: Partial<ParticipantEventRecord> = {}
): ParticipantEventRecord => ({ identity, timestamp, eventType: ParticipantEvent.Join, type: 'event', ...options });

const left = (
    identity: string,
    timestamp: number,
    options: Partial<ParticipantEventRecord> = {}
): ParticipantEventRecord => ({ identity, timestamp, eventType: ParticipantEvent.Leave, type: 'event', ...options });

const summarize = (rows: ReturnType<typeof getActivityEventRows>) => rows.map(({ id, ...row }) => row);

describe('getActivityEventRows', () => {
    it('should list every kind newest first, with your own join at the bottom below your first epoch', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 3), log(2500, 4), log(4000, 4, 'error')],
            participantEvents: [joined('alice', 2000), left('alice', 3000)],
            nameMap: { alice: 'Alice' },
        });

        expect(summarize(rows)).toEqual([
            { kind: 'epochError', timestamp: 4000, epoch: 4 },
            { kind: 'participantLeft', timestamp: 3000, name: 'Alice' },
            { kind: 'epochChange', timestamp: 2500, previousEpoch: 3, epoch: 4 },
            { kind: 'participantJoined', timestamp: 2000, name: 'Alice' },
            { kind: 'firstEpoch', timestamp: 1000, epoch: 3 },
            { kind: 'ownJoin', timestamp: 1000 },
        ]);
    });

    it('should keep your own join last even when another row is older', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(2000, 1)],
            participantEvents: [joined('alice', 1000)],
            nameMap: { alice: 'Alice' },
        });

        expect(rows.map((row) => row.kind)).toEqual(['firstEpoch', 'participantJoined', 'ownJoin']);
    });

    it('should not list your own join while there is no key rotation log', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [],
            participantEvents: [joined('alice', 1000)],
            nameMap: { alice: 'Alice' },
        });

        expect(rows.map((row) => row.kind)).toEqual(['participantJoined']);
    });

    it('should put the later-inserted row first when two rows share a timestamp', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [joined('alice', 2000), joined('bob', 2000)],
            nameMap: { alice: 'Alice', bob: 'Bob' },
        });

        expect(summarize(rows).slice(0, 2)).toEqual([
            { kind: 'participantJoined', timestamp: 2000, name: 'Bob' },
            { kind: 'participantJoined', timestamp: 2000, name: 'Alice' },
        ]);
    });

    it('should leave out the name until it is known, then give it to the same row', () => {
        const input = { keyRotationLogs: [log(1000, 1)], participantEvents: [joined('alice', 2000)] };

        const [withoutName] = getActivityEventRows({ ...input, nameMap: {} });
        const [withName] = getActivityEventRows({ ...input, nameMap: { alice: 'Alice' } });

        expect(withoutName).toEqual({ id: withName.id, kind: 'participantJoined', timestamp: 2000, name: undefined });
        expect(withName).toEqual({ id: withName.id, kind: 'participantJoined', timestamp: 2000, name: 'Alice' });
    });

    it('should name an agent with its agent name, not the name map', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [],
            participantEvents: [joined('agent-1', 1000, { isAgent: true })],
            nameMap: { 'agent-1': 'Raw identity name' },
        });

        expect(summarize(rows)).toEqual([{ kind: 'participantJoined', timestamp: 1000, name: 'Agent' }]);
    });

    it('should drop the leaves and rejoins replayed by your own reconnect', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [
                joined('alice', 2000),
                left('alice', 3000, { localReconnectId: 1 }),
                left('bob', 3000, { localReconnectId: 1 }),
                joined('alice', 4000, { localReconnectId: 1 }),
                joined('bob', 4000, { localReconnectId: 1 }),
            ],
            nameMap: { alice: 'Alice', bob: 'Bob' },
        });

        expect(summarize(rows)).toEqual([
            { kind: 'participantJoined', timestamp: 2000, name: 'Alice' },
            { kind: 'firstEpoch', timestamp: 1000, epoch: 1 },
            { kind: 'ownJoin', timestamp: 1000 },
        ]);
    });

    it('should keep a join replayed by your own reconnect when that person had no replayed leave', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [
                left('alice', 3000, { localReconnectId: 1 }),
                joined('alice', 4000, { localReconnectId: 1 }),
                joined('carol', 4000, { localReconnectId: 1 }),
            ],
            nameMap: { alice: 'Alice', carol: 'Carol' },
        });

        expect(summarize(rows).filter((row) => row.kind === 'participantJoined')).toEqual([
            { kind: 'participantJoined', timestamp: 4000, name: 'Carol' },
        ]);
    });

    it('should list a join during your second reconnect from someone who really left during the first', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [
                joined('bob', 2000),
                left('bob', 3000, { localReconnectId: 1 }),
                joined('bob', 9000, { localReconnectId: 2 }),
            ],
            nameMap: { bob: 'Bob' },
        });

        expect(summarize(rows)).toEqual([
            { kind: 'participantJoined', timestamp: 9000, name: 'Bob' },
            { kind: 'participantJoined', timestamp: 2000, name: 'Bob' },
            { kind: 'firstEpoch', timestamp: 1000, epoch: 1 },
            { kind: 'ownJoin', timestamp: 1000 },
        ]);
    });

    it('should list a join during your second reconnect after the person came back and left between reconnects', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [
                joined('bob', 2000),
                left('bob', 3000, { localReconnectId: 1 }),
                joined('bob', 5000),
                left('bob', 6000),
                joined('bob', 9000, { localReconnectId: 2 }),
            ],
            nameMap: { bob: 'Bob' },
        });

        expect(summarize(rows).slice(0, 4)).toEqual([
            { kind: 'participantJoined', timestamp: 9000, name: 'Bob' },
            { kind: 'participantLeft', timestamp: 6000, name: 'Bob' },
            { kind: 'participantJoined', timestamp: 5000, name: 'Bob' },
            { kind: 'participantJoined', timestamp: 2000, name: 'Bob' },
        ]);
    });

    it('should list a participant who drops and comes back as left, then joined', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 1)],
            participantEvents: [joined('alice', 2000), left('alice', 3000), joined('alice', 4000)],
            nameMap: { alice: 'Alice' },
        });

        expect(summarize(rows).slice(0, 3)).toEqual([
            { kind: 'participantJoined', timestamp: 4000, name: 'Alice' },
            { kind: 'participantLeft', timestamp: 3000, name: 'Alice' },
            { kind: 'participantJoined', timestamp: 2000, name: 'Alice' },
        ]);
    });

    it('should keep an epoch change to the same epoch', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 5), log(2000, 5)],
            participantEvents: [],
            nameMap: {},
        });

        expect(summarize(rows)[0]).toEqual({ kind: 'epochChange', timestamp: 2000, previousEpoch: 5, epoch: 5 });
    });

    it('should show errors as errors, including a first log that is an error', () => {
        const rows = getActivityEventRows({
            keyRotationLogs: [log(1000, 2, 'error'), log(2000, 3)],
            participantEvents: [],
            nameMap: {},
        });

        expect(summarize(rows)).toEqual([
            { kind: 'epochChange', timestamp: 2000, previousEpoch: 2, epoch: 3 },
            { kind: 'epochError', timestamp: 1000, epoch: 2 },
            { kind: 'ownJoin', timestamp: 1000 },
        ]);
    });
});
