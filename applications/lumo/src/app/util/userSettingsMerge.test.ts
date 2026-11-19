import type { FeatureFlag } from '../redux/slices/featureFlags';
import type { CustomAgent, LumoUserSettings, Memory } from '../redux/slices/lumoUserSettingsTypes';
import { type PersonalizationSettings, initialPersonalizationSettings } from '../redux/slices/personalization';
import { mergeUserSettingsChanges } from './userSettingsMerge';

const memory = (id: string, content = `memory ${id}`): Memory => ({ id, content, createdAt: 1, source: 'user' });

const flag = (id: string, versionId = '1'): FeatureFlag => ({ id, versionId, dismissedAt: 1, wasDeclined: false });

const agent = (id: string, name: string, updatedAt: number): CustomAgent => ({
    id,
    name,
    source: 'personal',
    createdAt: 1,
    updatedAt,
});

const personalization = (overrides: Partial<PersonalizationSettings> = {}): PersonalizationSettings => ({
    ...initialPersonalizationSettings,
    ...overrides,
});

const settings = (overrides: Partial<LumoUserSettings> = {}): LumoUserSettings => ({
    theme: 'auto',
    personalization: personalization(),
    featureFlags: [],
    showGallerySuggestions: true,
    ...overrides,
});

const ids = (items: { id: string }[] | undefined) => items?.map((item) => item.id);

describe('mergeUserSettingsChanges', () => {
    describe('plain values', () => {
        it('applies the changed value and keeps every other key from the server copy', () => {
            const remote = settings({ theme: 'dark', isMemoryEnabled: true, memories: [memory('1')] });

            const result = mergeUserSettingsChanges(remote, { isMemoryAutoSaveEnabled: false }, remote);

            expect(result.isMemoryAutoSaveEnabled).toBe(false);
            expect(result.theme).toBe('dark');
            expect(result.isMemoryEnabled).toBe(true);
            expect(ids(result.memories)).toEqual(['1']);
        });

        it('leaves merged keys untouched when they are not in the changes', () => {
            const remote = settings({ memories: [memory('1')], personalization: personalization({ nickname: 'Ann' }) });

            const result = mergeUserSettingsChanges(undefined, { theme: 'light' }, remote);

            expect(ids(result.memories)).toEqual(['1']);
            expect(result.personalization.nickname).toBe('Ann');
        });
    });

    describe('featureFlags', () => {
        it('keeps the union of dismissals from both sides', () => {
            const remote = settings({ featureFlags: [flag('a'), flag('b')] });

            const result = mergeUserSettingsChanges(undefined, { featureFlags: [flag('b'), flag('c')] }, remote);

            expect(result.featureFlags.map((f) => f.id)).toEqual(['a', 'b', 'c']);
        });

        it('treats another version of the same flag as a separate dismissal', () => {
            const remote = settings({ featureFlags: [flag('a', '1')] });

            const result = mergeUserSettingsChanges(undefined, { featureFlags: [flag('a', '2')] }, remote);

            expect(result.featureFlags.map((f) => `${f.id}:${f.versionId}`)).toEqual(['a:1', 'a:2']);
        });
    });

    describe('memories', () => {
        it('only adds when there is no base, so a device on defaults cannot wipe the server copy', () => {
            const remote = settings({ memories: [memory('1'), memory('2')] });

            const result = mergeUserSettingsChanges(undefined, { memories: [memory('3')] }, remote);

            expect(ids(result.memories)).toEqual(['1', '2', '3']);
        });

        it('keeps the server copy when a device on defaults sends an empty list', () => {
            const remote = settings({ memories: [memory('1'), memory('2')] });

            const result = mergeUserSettingsChanges(undefined, { memories: [] }, remote);

            expect(ids(result.memories)).toEqual(['1', '2']);
        });

        it('applies deletions of memories the device had', () => {
            const base = settings({ memories: [memory('1'), memory('2')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('2')] }, base);

            expect(ids(result.memories)).toEqual(['2']);
        });

        it('keeps memories added on other devices since the base', () => {
            const base = settings({ memories: [memory('1')] });
            const remote = settings({ memories: [memory('1'), memory('2')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('1'), memory('3')] }, remote);

            expect(ids(result.memories)).toEqual(['1', '2', '3']);
        });

        it('does not bring back memories deleted elsewhere that are still in the base', () => {
            const base = settings({ memories: [memory('1'), memory('2')] });
            const remote = settings({ memories: [memory('2')] });

            const result = mergeUserSettingsChanges(
                base,
                { memories: [memory('1'), memory('2'), memory('3')] },
                remote
            );

            expect(ids(result.memories)).toEqual(['2', '3']);
        });

        it('applies local edits', () => {
            const base = settings({ memories: [memory('1', 'old')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('1', 'new')] }, base);

            expect(result.memories?.[0].content).toBe('new');
        });

        it('keeps a memory deleted elsewhere deleted even if it was edited locally', () => {
            const base = settings({ memories: [memory('1', 'old'), memory('2')] });
            const remote = settings({ memories: [memory('2')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('1', 'new'), memory('2')] }, remote);

            expect(ids(result.memories)).toEqual(['2']);
        });

        it('drops a memory whose content already exists under another id, ignoring case', () => {
            const remote = settings({ memories: [memory('1', 'Likes tea')] });

            const result = mergeUserSettingsChanges(undefined, { memories: [memory('2', 'likes tea')] }, remote);

            expect(ids(result.memories)).toEqual(['1']);
        });
    });

    describe('customAgents', () => {
        it('keeps the newer edit when both sides edited the same agent', () => {
            const base = settings({ customAgents: [agent('a', 'base', 1)] });

            const localNewer = mergeUserSettingsChanges(
                base,
                { customAgents: [agent('a', 'local', 3)] },
                settings({ customAgents: [agent('a', 'remote', 2)] })
            );
            const remoteNewer = mergeUserSettingsChanges(
                base,
                { customAgents: [agent('a', 'local', 2)] },
                settings({ customAgents: [agent('a', 'remote', 3)] })
            );

            expect(localNewer.customAgents?.[0].name).toBe('local');
            expect(remoteNewer.customAgents?.[0].name).toBe('remote');
        });

        it('applies additions and deletions relative to the base', () => {
            const base = settings({ customAgents: [agent('a', 'a', 1), agent('b', 'b', 1)] });

            const result = mergeUserSettingsChanges(
                base,
                { customAgents: [agent('a', 'a', 1), agent('c', 'c', 1)] },
                base
            );

            expect(ids(result.customAgents)).toEqual(['a', 'c']);
        });
    });

    describe('personalization', () => {
        it('only applies fields changed from the defaults when there is no base', () => {
            const remote = settings({
                personalization: personalization({ nickname: 'Ann', jobRole: 'Dev', additionalContext: 'ctx' }),
            });

            const result = mergeUserSettingsChanges(
                undefined,
                { personalization: personalization({ nickname: 'Bo' }) },
                remote
            );

            expect(result.personalization).toEqual(
                personalization({ nickname: 'Bo', jobRole: 'Dev', additionalContext: 'ctx' })
            );
        });

        it('applies a field cleared on purpose relative to the base', () => {
            const base = settings({ personalization: personalization({ nickname: 'Ann', jobRole: 'Dev' }) });

            const result = mergeUserSettingsChanges(
                base,
                { personalization: personalization({ nickname: 'Ann', jobRole: '' }) },
                base
            );

            expect(result.personalization.jobRole).toBe('');
            expect(result.personalization.nickname).toBe('Ann');
        });

        it('keeps fields changed on other devices since the base', () => {
            const base = settings({ personalization: personalization({ nickname: 'Ann' }) });
            const remote = settings({ personalization: personalization({ nickname: 'Ann', jobRole: 'Dev' }) });

            const result = mergeUserSettingsChanges(
                base,
                { personalization: personalization({ nickname: 'Bo' }) },
                remote
            );

            expect(result.personalization).toEqual(personalization({ nickname: 'Bo', jobRole: 'Dev' }));
        });

        it('merges traits one by one', () => {
            const base = settings({ personalization: personalization({ traits: ['a', 'b'] }) });
            const remote = settings({ personalization: personalization({ traits: ['a', 'b', 'c'] }) });

            const result = mergeUserSettingsChanges(
                base,
                { personalization: personalization({ traits: ['b', 'd'] }) },
                remote
            );

            expect(result.personalization.traits).toEqual(['b', 'c', 'd']);
        });
    });
    describe('edge cases', () => {
        it('does not treat a structurally equal copy as a local edit', () => {
            const base = settings({ memories: [memory('1', 'old')] });
            const remote = settings({ memories: [memory('1', 'edited elsewhere')] });

            const result = mergeUserSettingsChanges(base, { memories: [{ ...memory('1', 'old') }] }, remote);

            expect(result.memories?.[0].content).toBe('edited elsewhere');
        });

        it('does not mutate frozen inputs', () => {
            const freeze = <T>(value: T): T => {
                Object.values(value as object).forEach((child) => {
                    if (child && typeof child === 'object') {
                        freeze(child);
                    }
                });
                return Object.freeze(value);
            };
            const base = freeze(
                settings({ memories: [memory('1')], personalization: personalization({ traits: ['a'] }) })
            );
            const changes = freeze({
                memories: [memory('2')],
                personalization: personalization({ nickname: 'Bo', traits: ['b'] }),
                featureFlags: [flag('b')],
                customAgents: [agent('a', 'a', 1)],
            });
            const remote = freeze(settings({ memories: [memory('1')], featureFlags: [flag('a')] }));

            expect(() => mergeUserSettingsChanges(base, changes, remote)).not.toThrow();
        });

        it('handles a server copy written before these fields existed', () => {
            const remote = { theme: 'dark', showGallerySuggestions: true } as LumoUserSettings;

            const result = mergeUserSettingsChanges(
                undefined,
                {
                    memories: [memory('1')],
                    customAgents: [agent('a', 'a', 1)],
                    featureFlags: [flag('a')],
                    personalization: personalization({ nickname: 'Bo' }),
                },
                remote
            );

            expect(ids(result.memories)).toEqual(['1']);
            expect(ids(result.customAgents)).toEqual(['a']);
            expect(result.featureFlags.map((f) => f.id)).toEqual(['a']);
            expect(result.personalization).toEqual(personalization({ nickname: 'Bo' }));
        });

        it('keeps the server version of an item a device with no base holds a stale copy of', () => {
            const remote = settings({ memories: [memory('1', 'current')] });

            const result = mergeUserSettingsChanges(undefined, { memories: [memory('1', 'stale')] }, remote);

            expect(result.memories?.[0].content).toBe('current');
        });

        it('keeps the local edit when both sides edited the same memory', () => {
            const base = settings({ memories: [memory('1', 'old')] });
            const remote = settings({ memories: [memory('1', 'remote edit')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('1', 'local edit')] }, remote);

            expect(result.memories?.[0].content).toBe('local edit');
        });

        it('does not duplicate an item added on both sides with the same id', () => {
            const remote = settings({ customAgents: [agent('a', 'a', 1)] });

            const result = mergeUserSettingsChanges(undefined, { customAgents: [agent('a', 'a', 1)] }, remote);

            expect(ids(result.customAgents)).toEqual(['a']);
        });

        it('also collapses duplicate content already on the server', () => {
            const remote = settings({ memories: [memory('1', 'Likes tea'), memory('2', 'likes tea')] });

            const result = mergeUserSettingsChanges(undefined, { memories: [memory('3', 'Likes coffee')] }, remote);

            expect(ids(result.memories)).toEqual(['1', '3']);
        });

        it('does not duplicate a trait added on both sides, and handles empty trait lists', () => {
            const base = settings({ personalization: personalization({ traits: [] }) });
            const remote = settings({ personalization: personalization({ traits: ['a'] }) });

            const added = mergeUserSettingsChanges(
                base,
                { personalization: personalization({ traits: ['a'] }) },
                remote
            );
            const empty = mergeUserSettingsChanges(base, { personalization: personalization({ traits: [] }) }, base);

            expect(added.personalization.traits).toEqual(['a']);
            expect(empty.personalization.traits).toEqual([]);
        });

        it('lists server items first, then local additions', () => {
            const base = settings({ memories: [memory('1')] });
            const remote = settings({ memories: [memory('2'), memory('1')] });

            const result = mergeUserSettingsChanges(base, { memories: [memory('3'), memory('1')] }, remote);

            expect(ids(result.memories)).toEqual(['2', '1', '3']);
        });
    });
});
