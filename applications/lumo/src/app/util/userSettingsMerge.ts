import isEqual from 'lodash/isEqual';

import type { FeatureFlag } from '../redux/slices/featureFlags';
import type { CustomAgent, LumoUserSettings, Memory } from '../redux/slices/lumoUserSettingsTypes';
import type { PersonalizationSettings } from '../redux/slices/personalization';
import { initialPersonalizationSettings } from '../redux/slices/personalization';

/**
 * Merges a device's changes into the server's copy of the settings.
 *
 * - `base`: the copy this device's state started from (last server load or save, or the local copy). Comparing it with
 *   `changes` tells what the user actually changed here, so an item missing locally means "deleted here", not "never
 *   loaded here". When the device started from defaults, `base` is undefined, so it can only add, never remove or blank.
 * - `changes`: the keys this device changed.
 * - `remote`: the server's latest copy.
 *
 * Keys without a merger here are plain values: the changed value wins.
 */
export const mergeUserSettingsChanges = (
    base: Partial<LumoUserSettings> | undefined,
    changes: Partial<LumoUserSettings>,
    remote: LumoUserSettings
): LumoUserSettings => {
    const next: LumoUserSettings = { ...remote, ...changes };

    if (changes.featureFlags) {
        next.featureFlags = mergeFeatureFlags(changes.featureFlags, remote.featureFlags ?? []);
    }
    if (changes.memories) {
        next.memories = mergeMemories(base?.memories ?? [], changes.memories, remote.memories ?? []);
    }
    if (changes.customAgents) {
        next.customAgents = mergeById<CustomAgent>(
            base?.customAgents ?? [],
            changes.customAgents,
            remote.customAgents ?? [],
            (local, server) => (local.updatedAt >= server.updatedAt ? local : server)
        );
    }
    if (changes.personalization) {
        next.personalization = mergePersonalization(
            base?.personalization ?? initialPersonalizationSettings,
            changes.personalization,
            remote.personalization ?? initialPersonalizationSettings
        );
    }

    return next;
};

/** Dismissals are only ever added, so the union never loses one. */
const mergeFeatureFlags = (local: FeatureFlag[], remote: FeatureFlag[]): FeatureFlag[] => {
    const getKey = (flag: FeatureFlag) => `${flag.id}:${flag.versionId}`;
    const remoteKeys = new Set(remote.map(getKey));
    return [...remote, ...local.filter((flag) => !remoteKeys.has(getKey(flag)))];
};

const mergeMemories = (base: Memory[], local: Memory[], remote: Memory[]): Memory[] => {
    const seen = new Set<string>();
    // The same memory can be generated on two devices under different ids: keep the first one.
    return mergeById(base, local, remote).filter((memory) => {
        const key = memory.content.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

/**
 * Applies the additions, edits and deletions `local` made relative to `base` onto `remote`, keeping
 * items added or edited on other devices. When both sides edited an item, `pickEdit` decides; by
 * default the local edit wins.
 */
const mergeById = <T extends { id: string }>(
    base: T[],
    local: T[],
    remote: T[],
    pickEdit: (local: T, remote: T) => T = (localItem) => localItem
): T[] => {
    const baseById = new Map(base.map((item) => [item.id, item]));
    const localIds = new Set(local.map((item) => item.id));

    const deletedIds = new Set(base.filter((item) => !localIds.has(item.id)).map((item) => item.id));
    const editedById = new Map(
        local
            .filter((item) => baseById.has(item.id) && !isEqual(baseById.get(item.id), item))
            .map((item) => [item.id, item])
    );

    const kept = remote
        .filter((item) => !deletedIds.has(item.id))
        .map((item) => {
            const edited = editedById.get(item.id);
            return edited ? pickEdit(edited, item) : item;
        });
    const keptIds = new Set(kept.map((item) => item.id));
    const added = local.filter((item) => !baseById.has(item.id) && !keptIds.has(item.id));

    return [...kept, ...added];
};

/** Only the fields changed relative to `base` are applied; `traits` merges trait by trait. */
const mergePersonalization = (
    base: PersonalizationSettings,
    local: PersonalizationSettings,
    remote: PersonalizationSettings
): PersonalizationSettings => {
    const next: PersonalizationSettings = { ...remote };
    for (const key of Object.keys(local) as (keyof PersonalizationSettings)[]) {
        if (key !== 'traits' && !isEqual(local[key], base[key])) {
            Object.assign(next, { [key]: local[key] });
        }
    }

    const baseTraits = base.traits ?? [];
    const localTraits = local.traits ?? [];
    const removedTraits = new Set(baseTraits.filter((trait) => !localTraits.includes(trait)));
    const addedTraits = localTraits.filter((trait) => !baseTraits.includes(trait));
    const remoteTraits = (remote.traits ?? []).filter((trait) => !removedTraits.has(trait));
    next.traits = [...remoteTraits, ...addedTraits.filter((trait) => !remoteTraits.includes(trait))];

    return next;
};
