import { ConflictClientError } from '../../redux/sagas/sagaErrors';
import { selectMasterKeysBundle } from '../../redux/selectors';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { LumoThunkArguments } from '../../redux/thunk';
import type { RemoteSkillFile } from '../../remote/skills';
import type { RemoteId } from '../../remote/types';
import { safeLogger } from '../../util/safeLogger';
import { type LiveSerializedSkillAsset, type SkillSyncStep, planSkillSync } from './skillSyncPlan';
import { refreshSkills } from './skillsThunks';
import type { SerializedSkill, SkillId } from './types';

const PRIORITY = 'background';

const downloadFiles = async (
    { lumoApi }: LumoThunkArguments,
    skillId: SkillId,
    files: RemoteSkillFile[]
): Promise<LiveSerializedSkillAsset[]> => {
    const downloaded = await Promise.all(
        files.map(async ({ remoteId, tag, createdAt }) => {
            const encrypted = await lumoApi.getSkillFile(remoteId);
            return encrypted ? { id: tag, skillId, createdAt, updatedAt: createdAt, encrypted } : null;
        })
    );
    return downloaded.filter((file) => file !== null);
};

const uploadFiles = async (
    { lumoApi }: LumoThunkArguments,
    skillRemoteId: RemoteId,
    files: LiveSerializedSkillAsset[]
) => {
    for (const { id, encrypted } of files) {
        if (typeof encrypted !== 'string') {
            continue;
        }
        try {
            await lumoApi.postSkillFile(skillRemoteId, { SkillFileTag: id, Encrypted: encrypted }, PRIORITY);
        } catch (error) {
            // Already uploaded by an earlier, interrupted sync
            if (!(error instanceof ConflictClientError)) {
                throw error;
            }
        }
    }
};

/** Runs one step of the plan. Resolves to true when it changed what the UI shows. */
const runStep = async (extra: LumoThunkArguments, step: SkillSyncStep): Promise<boolean> => {
    const { dbApi, lumoApi } = extra;

    switch (step.kind) {
        case 'push': {
            const { skill } = step;
            if (typeof skill.encrypted !== 'string') {
                return false;
            }
            const payload = { SkillKey: skill.wrappedSkillKey, Encrypted: skill.encrypted };
            let remoteId = step.remoteId;
            try {
                if (remoteId) {
                    if ((await lumoApi.putSkill(remoteId, payload, PRIORITY)) === 'deleted') {
                        await dbApi.markSkillDeletedFromRemote(skill.id, true);
                        return true;
                    }
                } else {
                    remoteId = await lumoApi.postSkill({ SkillTag: skill.id, ...payload }, PRIORITY);
                }
            } catch (error) {
                // The tag is taken by a skill deleted on another device: the deletion wins
                if (error instanceof ConflictClientError) {
                    await dbApi.markSkillDeletedFromRemote(skill.id, true);
                    return true;
                }
                throw error;
            }

            await uploadFiles(extra, remoteId, step.createFiles);
            for (const fileId of step.deleteFiles) {
                await lumoApi.deleteSkillFile(fileId, PRIORITY);
            }
            const downloaded = await downloadFiles(extra, skill.id, step.downloadFiles);
            await dbApi.putRemoteSkill(undefined, downloaded);
            await dbApi.dropSkillAssets(step.dropAssetIds);
            await dbApi.markSkillSynced(skill.id, skill.updatedAt, step.liveAssetIds);
            return downloaded.length > 0;
        }
        case 'pushDelete': {
            if (step.remoteId) {
                await lumoApi.deleteSkill(step.remoteId, PRIORITY);
            }
            await dbApi.markSkillDeletedFromRemote(step.skill.id);
            return false;
        }
        case 'pull': {
            const { remote } = step;
            const skill: SerializedSkill | undefined = step.writeSkill
                ? {
                      id: remote.tag,
                      createdAt: remote.createdAt,
                      updatedAt: remote.updatedAt,
                      wrappedSkillKey: remote.wrappedSkillKey,
                      encrypted: remote.encrypted,
                  }
                : undefined;
            const downloaded = await downloadFiles(extra, remote.tag, step.downloadFiles);
            await dbApi.putRemoteSkill(skill, downloaded);
            await dbApi.dropSkillAssets(step.dropAssetIds);
            return true;
        }
        case 'deleteLocal': {
            await dbApi.markSkillDeletedFromRemote(step.skillId);
            return true;
        }
    }
};

const runSync = async (extra: LumoThunkArguments): Promise<boolean> => {
    const [localSkills, localAssets, remoteSkills] = await Promise.all([
        extra.dbApi.getAllSkills(),
        extra.dbApi.getAllSkillAssets(),
        extra.lumoApi.listSkills(),
    ]);

    let changed = false;
    for (const step of planSkillSync(localSkills, localAssets, remoteSkills)) {
        try {
            changed = (await runStep(extra, step)) || changed;
        } catch (error) {
            // Left dirty, so the next sync retries it
            safeLogger.warn(`Skill sync: ${step.kind} failed`, error);
        }
    }
    return changed;
};

let running: Promise<void> | undefined;
let rerunRequested = false;

/**
 * Pushes local skill changes and pulls remote ones. Calls made while a sync runs are folded into one
 * more pass, so the latest local state always gets synced.
 */
export const syncSkills =
    () =>
    async (dispatch: LumoDispatch, getState: () => LumoState, extra: LumoThunkArguments): Promise<void> => {
        if (!selectMasterKeysBundle(getState())) {
            return;
        }
        if (running) {
            rerunRequested = true;
            return running;
        }

        running = (async () => {
            let changed = false;
            do {
                rerunRequested = false;
                try {
                    changed = (await runSync(extra)) || changed;
                } catch (error) {
                    safeLogger.warn('Skill sync failed', error);
                }
            } while (rerunRequested);
            if (changed) {
                await dispatch(refreshSkills());
            }
        })().finally(() => {
            running = undefined;
        });

        return running;
    };
