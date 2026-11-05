import type { SkillRuntime } from '../features/skills/skillRuntime';

declare global {
    interface Window {
        LumoSkillRuntime?: SkillRuntime;
    }
}

/** Composition boundary. Ordinary web has no host implementation. */
export const getSkillRuntime = (): SkillRuntime | undefined =>
    typeof window !== 'undefined' && window.LumoSkillRuntime?.protocolVersion === 1
        ? window.LumoSkillRuntime
        : undefined;
