import { computeSHA256 } from '@protontech/crypto/subtle/hash.ts';

/** Implemented by the host, injected at bootstrap. Skill code knows no filesystem or process details. */
export interface SkillRuntime {
    protocolVersion: 1;
    syncBundle(bundle: {
        skillId: string;
        revision: string;
        files: { path: string; data: Uint8Array<ArrayBuffer> }[];
    }): Promise<void>;
    executeScript(request: {
        skillId: string;
        revision: string;
        skillPath: string;
        scriptPath: string;
        args: string[];
    }): Promise<unknown>;
    /** Retain enabled bundles; content revisions are supplied only when synchronizing/executing. */
    retain(input: { skills: { skillId: string }[] }): Promise<void>;
}

/** Identify the exact supplied files, including files-only sync changes and removals. */
export const getSkillBundleRevision = async (
    files: { path: string; data: Uint8Array<ArrayBuffer> }[]
): Promise<string> => {
    const hash = async (data: Uint8Array<ArrayBuffer>) =>
        Array.from(await computeSHA256(data), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const ordered = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    const manifest = await Promise.all(ordered.map(async ({ path, data }) => [path, await hash(data)]));
    return hash(new TextEncoder().encode(JSON.stringify(manifest)));
};
