import type { RemoteSkill } from '../../remote/skills';
import { planSkillSync } from './skillSyncPlan';
import type { SerializedSkill, SerializedSkillAsset } from './types';

const DATE = '2026-10-23T10:00:00.000Z';

const liveSkill = (id: string, overrides: Partial<SerializedSkill> = {}): SerializedSkill =>
    ({
        id,
        createdAt: DATE,
        updatedAt: DATE,
        wrappedSkillKey: `key-${id}`,
        encrypted: `enc-${id}`,
        ...overrides,
    }) as SerializedSkill;

const deletedSkill = (id: string, dirty: boolean): SerializedSkill => ({
    id,
    createdAt: DATE,
    updatedAt: DATE,
    deleted: true,
    dirty,
});

const asset = (id: string, skillId: string, overrides: Partial<SerializedSkillAsset> = {}): SerializedSkillAsset =>
    ({
        id,
        skillId,
        createdAt: DATE,
        updatedAt: DATE,
        encrypted: `enc-${id}`,
        ...overrides,
    }) as SerializedSkillAsset;

const remoteSkill = (tag: string, fileTags: string[] = [], overrides: Partial<RemoteSkill> = {}): RemoteSkill => ({
    remoteId: `r-${tag}`,
    tag,
    createdAt: DATE,
    updatedAt: DATE,
    wrappedSkillKey: `key-${tag}`,
    encrypted: `enc-${tag}`,
    files: fileTags.map((fileTag) => ({ remoteId: `r-${fileTag}`, tag: fileTag, createdAt: DATE })),
    ...overrides,
});

describe('planSkillSync', () => {
    it('creates dirty skills the server does not have, with their files', () => {
        const steps = planSkillSync(
            [liveSkill('s1', { dirty: true })],
            [asset('a1', 's1', { dirty: true }), asset('a2', 's1', { deleted: true, dirty: true } as never)],
            []
        );

        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            kind: 'push',
            remoteId: undefined,
            deleteFiles: [],
            downloadFiles: [],
            dropAssetIds: ['a2'],
            liveAssetIds: ['a1'],
        });
        expect(steps[0].kind === 'push' && steps[0].createFiles.map(({ id }) => id)).toEqual(['a1']);
    });

    it('updates dirty skills and reconciles their files with the server', () => {
        const steps = planSkillSync(
            [liveSkill('s1', { dirty: true })],
            [
                asset('kept', 's1'),
                asset('new', 's1', { dirty: true }),
                asset('removed', 's1', { deleted: true, dirty: true } as never),
            ],
            [remoteSkill('s1', ['kept', 'removed', 'other-device'])]
        );

        expect(steps).toHaveLength(1);
        const [step] = steps;
        expect(step).toMatchObject({ kind: 'push', remoteId: 'r-s1', deleteFiles: ['r-removed'] });
        if (step.kind !== 'push') throw new Error('expected push');
        expect(step.createFiles.map(({ id }) => id)).toEqual(['new']);
        expect(step.downloadFiles.map(({ tag }) => tag)).toEqual(['other-device']);
        expect(step.dropAssetIds).toEqual(['removed']);
    });

    it('pushes local deletions, even when the server already lost the skill', () => {
        const steps = planSkillSync(
            [deletedSkill('s1', true), deletedSkill('s2', true)],
            [asset('a1', 's1', { deleted: true, dirty: true } as never)],
            [remoteSkill('s1')]
        );

        expect(steps).toEqual([
            { kind: 'pushDelete', skill: deletedSkill('s1', true), remoteId: 'r-s1', dropAssetIds: ['a1'] },
            { kind: 'pushDelete', skill: deletedSkill('s2', true), remoteId: undefined, dropAssetIds: [] },
        ]);
    });

    it('ignores clean tombstones', () => {
        expect(planSkillSync([deletedSkill('s1', false)], [], [])).toEqual([]);
    });

    it('deletes clean local skills that are gone from the server', () => {
        expect(planSkillSync([liveSkill('s1')], [asset('a1', 's1')], [])).toEqual([
            { kind: 'deleteLocal', skillId: 's1' },
        ]);
    });

    it('does nothing when a clean skill matches the server', () => {
        expect(planSkillSync([liveSkill('s1')], [asset('a1', 's1')], [remoteSkill('s1', ['a1'])])).toEqual([]);
    });

    it('pulls remote changes into clean skills', () => {
        const steps = planSkillSync(
            [liveSkill('s1')],
            [asset('kept', 's1'), asset('gone', 's1')],
            [remoteSkill('s1', ['kept', 'added'], { encrypted: 'enc-changed' })]
        );

        expect(steps).toHaveLength(1);
        const [step] = steps;
        expect(step).toMatchObject({ kind: 'pull', writeSkill: true, dropAssetIds: ['gone'] });
        if (step.kind !== 'pull') throw new Error('expected pull');
        expect(step.downloadFiles.map(({ tag }) => tag)).toEqual(['added']);
    });

    it('pulls skills created on another device', () => {
        const remote = remoteSkill('s1', ['a1']);
        expect(planSkillSync([], [], [remote])).toEqual([
            { kind: 'pull', remote, writeSkill: true, downloadFiles: remote.files, dropAssetIds: [] },
        ]);
    });
});
