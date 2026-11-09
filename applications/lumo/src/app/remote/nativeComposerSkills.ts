import { getSkillCommands, groupSkillCommands, prependSkillHandle } from '../features/skills/skillInvocation';
import { getSkillSelectionId } from '../features/skills/skillSelection';
import type { Skill } from '../features/skills/types';

interface NativeSkillCommand {
    id: string;
    handle: string;
    name: string;
    description: string;
    group?: string;
}

export interface NativeSkillsState {
    version: 1;
    status: 'unavailable' | 'loading' | 'ready' | 'error';
    /** Opaque token scoped to this composer/account and catalog. Never persist it. */
    revision: string;
    commands: NativeSkillCommand[];
}

export const unavailableNativeSkills = (): NativeSkillsState => ({
    version: 1,
    status: 'unavailable',
    revision: '',
    commands: [],
});

export type NativeSkillInvocationHandler = (request: unknown) => { text: string };

/** A composer-owned adapter; instructions and files never enter the bridge. */
export const createNativeSkillsController = ({
    owner,
    getSource,
    setDraft,
    publish,
}: {
    owner: string;
    getSource: () => {
        owner: string | undefined;
        available?: boolean;
        status: 'idle' | 'loading' | 'ready' | 'error';
        skills: Skill[];
    };
    setDraft: (text: string) => void;
    publish: (state: NativeSkillsState) => void;
}) => {
    const session = crypto.randomUUID();
    let generation = 0;
    let disposed = false;
    let fingerprint = '';
    let snapshot = unavailableNativeSkills();

    const refresh = (): NativeSkillsState => {
        const source = getSource();
        const status =
            disposed || source.owner !== owner || source.available === false
                ? 'unavailable'
                : source.status === 'idle'
                  ? 'loading'
                  : source.status;
        const commands =
            status === 'ready'
                ? groupSkillCommands(getSkillCommands(source.skills)).map(({ skillId, subSkillPath, ...command }) => ({
                      ...command,
                      id: getSkillSelectionId({ skillId, subSkillPath }),
                  }))
                : [];
        const nextFingerprint = JSON.stringify({ status, commands });
        if (nextFingerprint !== fingerprint) {
            fingerprint = nextFingerprint;
            snapshot = { version: 1, status, commands, revision: `${session}:${++generation}` };
            publish(snapshot);
        }
        return snapshot;
    };

    const invoke: NativeSkillInvocationHandler = (request) => {
        if (
            !request ||
            typeof request !== 'object' ||
            !('revision' in request) ||
            typeof request.revision !== 'string' ||
            !('id' in request) ||
            typeof request.id !== 'string' ||
            !('text' in request) ||
            typeof request.text !== 'string'
        ) {
            throw new Error('skills_invalid_request');
        }
        // Read synchronously: Redux can change before React effects publish the new list.
        const current = refresh();
        if (current.status !== 'ready') throw new Error('skills_unavailable');
        const command = current.commands.find(({ id }) => id === request.id);
        if (current.revision !== request.revision || !command) throw new Error('skills_stale');
        const text = prependSkillHandle(request.text, command.handle);
        setDraft(text);
        return { text };
    };

    return {
        refresh,
        invoke,
        dispose: () => {
            disposed = true;
            refresh();
        },
    };
};
