import type { RemoteSkill, RemoteSkillFile } from '../../remote/skills';
import type { RemoteId } from '../../remote/types';
import type { SerializedSkill, SerializedSkillAsset, SkillId } from './types';

type LiveSerializedSkill = Extract<SerializedSkill, { wrappedSkillKey: string }>;
export type LiveSerializedSkillAsset = Extract<SerializedSkillAsset, { encrypted: unknown }>;

export type SkillSyncStep =
    /** Local changes win: create or update the remote skill, then reconcile its files. */
    | {
          kind: 'push';
          skill: LiveSerializedSkill;
          remoteId?: RemoteId;
          createFiles: LiveSerializedSkillAsset[];
          deleteFiles: RemoteId[];
          downloadFiles: RemoteSkillFile[];
          dropAssetIds: string[];
          /** Every live file of the skill, all on the server once the step succeeded. */
          liveAssetIds: string[];
      }
    | { kind: 'pushDelete'; skill: SerializedSkill; remoteId?: RemoteId; dropAssetIds: string[] }
    /** The remote copy wins: store it locally and fetch the files we don't have. */
    | {
          kind: 'pull';
          remote: RemoteSkill;
          writeSkill: boolean;
          downloadFiles: RemoteSkillFile[];
          dropAssetIds: string[];
      }
    /** Deleted on another device. */
    | { kind: 'deleteLocal'; skillId: SkillId };

const isLiveSkill = (skill: SerializedSkill): skill is LiveSerializedSkill => !skill.deleted;
const isLiveAsset = (asset: SerializedSkillAsset): asset is LiveSerializedSkillAsset => !asset.deleted;

const groupAssets = (assets: SerializedSkillAsset[]) => {
    const bySkill = new Map<SkillId, SerializedSkillAsset[]>();
    for (const asset of assets) {
        bySkill.set(asset.skillId, [...(bySkill.get(asset.skillId) ?? []), asset]);
    }
    return bySkill;
};

const planPush = (
    skill: LiveSerializedSkill,
    assets: SerializedSkillAsset[],
    remote: RemoteSkill | undefined
): SkillSyncStep => {
    const remoteFiles = new Map((remote?.files ?? []).map((file) => [file.tag, file]));
    const knownIds = new Set(assets.map(({ id }) => id));
    const live = assets.filter(isLiveAsset);
    const tombstones = assets.filter((asset) => asset.deleted);
    return {
        kind: 'push',
        skill,
        remoteId: remote?.remoteId,
        createFiles: live.filter(({ id }) => !remoteFiles.has(id)),
        deleteFiles: tombstones.flatMap(({ id }) => {
            const file = remoteFiles.get(id);
            return file ? [file.remoteId] : [];
        }),
        downloadFiles: (remote?.files ?? []).filter(({ tag }) => !knownIds.has(tag)),
        dropAssetIds: tombstones.map(({ id }) => id),
        liveAssetIds: live.map(({ id }) => id),
    };
};

const sameSkill = (local: LiveSerializedSkill, remote: RemoteSkill) =>
    local.encrypted === remote.encrypted && local.wrappedSkillKey === remote.wrappedSkillKey;

const planPull = (
    local: LiveSerializedSkill | undefined,
    assets: SerializedSkillAsset[],
    remote: RemoteSkill
): SkillSyncStep | undefined => {
    const remoteTags = new Set(remote.files.map(({ tag }) => tag));
    const liveIds = new Set(assets.filter(isLiveAsset).map(({ id }) => id));
    const step: SkillSyncStep = {
        kind: 'pull',
        remote,
        writeSkill: !local || !sameSkill(local, remote),
        downloadFiles: remote.files.filter(({ tag }) => !liveIds.has(tag)),
        dropAssetIds: assets.filter((asset) => asset.deleted || !remoteTags.has(asset.id)).map(({ id }) => id),
    };
    const isNoop = !step.writeSkill && step.downloadFiles.length === 0 && step.dropAssetIds.length === 0;
    return isNoop ? undefined : step;
};

/**
 * Works out how to reconcile local skills with the server. Dirty local records are pushed; clean
 * ones mirror the server, which is the source of truth for anything this device didn't change.
 */
export const planSkillSync = (
    localSkills: SerializedSkill[],
    localAssets: SerializedSkillAsset[],
    remoteSkills: RemoteSkill[]
): SkillSyncStep[] => {
    const remoteByTag = new Map(remoteSkills.map((skill) => [skill.tag, skill]));
    const assetsBySkill = groupAssets(localAssets);
    const steps: SkillSyncStep[] = [];

    for (const local of localSkills) {
        const remote = remoteByTag.get(local.id);
        const assets = assetsBySkill.get(local.id) ?? [];
        remoteByTag.delete(local.id);

        if (local.dirty) {
            steps.push(
                isLiveSkill(local)
                    ? planPush(local, assets, remote)
                    : {
                          kind: 'pushDelete',
                          skill: local,
                          remoteId: remote?.remoteId,
                          dropAssetIds: assets.map(({ id }) => id),
                      }
            );
        } else if (isLiveSkill(local)) {
            const step = remote ? planPull(local, assets, remote) : { kind: 'deleteLocal' as const, skillId: local.id };
            if (step) {
                steps.push(step);
            }
        }
    }

    for (const remote of remoteByTag.values()) {
        steps.push({ kind: 'pull', remote, writeSkill: true, downloadFiles: remote.files, dropAssetIds: [] });
    }

    return steps;
};
