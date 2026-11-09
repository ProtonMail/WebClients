import { getSkillCommands, groupSkillCommands } from '../features/skills/skillInvocation';
import { getSkillSelectionId } from '../features/skills/skillSelection';
import type { Skill } from '../features/skills/types';
import { createNativeSkillsController } from './nativeComposerSkills';

const skill = (id: string, overrides: Partial<Skill> = {}): Skill => ({
    id,
    name: id,
    description: 'Summary',
    instructions: 'Instructions',
    enabled: true,
    createdAt: '',
    updatedAt: '',
    skillKey: '',
    source: 'created',
    ...overrides,
});
const plugin = skill('plugin', {
    instructions: '',
    plugin: {},
    subSkills: [
        { name: 'chart', path: 'skills/chart', description: 'Charts', enabled: true },
        { name: 'off', path: 'skills/off', description: '', enabled: false },
    ],
});

describe('native Skills controller', () => {
    let source: { owner: string; status: 'ready' | 'idle' | 'loading' | 'error'; skills: Skill[] };
    let setDraft: jest.Mock;
    let publish: jest.Mock;
    let controller: ReturnType<typeof createNativeSkillsController>;
    beforeEach(() => {
        source = { owner: 'account', status: 'ready', skills: [skill('draft'), plugin] };
        setDraft = jest.fn();
        publish = jest.fn();
        controller = createNativeSkillsController({ owner: 'account', getSource: () => source, setDraft, publish });
    });
    const request = () => ({
        revision: controller.refresh().revision,
        id: 'plugin/skills/chart',
        text: 'My report\nKeep this',
    });

    it('exports roots and enabled plugin sub-skills using the web ordering and collision winners', () => {
        source.skills.push(skill('disabled', { enabled: false }), skill('duplicate', { name: 'chart' }));
        expect(controller.refresh().commands).toEqual(
            groupSkillCommands(getSkillCommands(source.skills)).map(({ skillId, subSkillPath, ...command }) => ({
                ...command,
                id: getSkillSelectionId({ skillId, subSkillPath }),
            }))
        );
        expect(controller.refresh().commands.map(({ handle }) => handle)).toEqual(['chart', 'draft']);
    });
    it('propagates newly added commands and does not republish unchanged snapshots', () => {
        const first = controller.refresh();
        controller.refresh();
        expect(publish).toHaveBeenCalledTimes(1);
        source.skills = [...source.skills, skill('code-review')];
        expect(controller.refresh().revision).not.toBe(first.revision);
        expect(controller.refresh().commands.map(({ handle }) => handle)).toContain('code-review');
    });
    it('updates the actual draft from native text without an editor DOM and avoids duplicate insertion', () => {
        expect(controller.invoke(request())).toEqual({ text: '/chart My report\nKeep this' });
        expect(setDraft).toHaveBeenLastCalledWith('/chart My report\nKeep this');
        expect(controller.invoke({ ...request(), text: 'Please /chart this' })).toEqual({ text: 'Please /chart this' });
    });
    it.each(['delete', 'disable', 'collision'])('rejects %s before the next publication/effect', (change) => {
        const pending = request();
        if (change === 'delete') source.skills = [];
        if (change === 'disable') source.skills = [skill('plugin', { ...plugin, enabled: false })];
        if (change === 'collision') source.skills.push(skill('root', { name: 'chart' }));
        expect(() => controller.invoke(pending)).toThrow('skills_stale');
        expect(setDraft).not.toHaveBeenCalled();
    });
    it.each(['idle', 'loading', 'error'] as const)('publishes %s without commands and rejects invocation', (status) => {
        const pending = request();
        source.status = status;
        expect(controller.refresh()).toMatchObject({ status: status === 'idle' ? 'loading' : status, commands: [] });
        expect(() => controller.invoke(pending)).toThrow('skills_unavailable');
    });
    it('distinguishes an empty ready catalog', () => {
        source.skills = [];
        expect(controller.refresh()).toMatchObject({ status: 'ready', commands: [] });
    });
    it('invalidates a previous account even without unmount', () => {
        const pending = request();
        source.owner = 'other';
        expect(controller.refresh()).toMatchObject({ status: 'unavailable', commands: [] });
        expect(() => controller.invoke(pending)).toThrow('skills_unavailable');
        source.owner = 'account';
        expect(() => controller.invoke(pending)).toThrow('skills_stale');
    });
    it('clears on teardown and rejects saved callbacks', () => {
        const pending = request();
        controller.dispose();
        expect(publish).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'unavailable', commands: [] }));
        expect(() => controller.invoke(pending)).toThrow('skills_unavailable');
    });
    it.each([null, {}, { text: 1, id: 'draft', revision: 'old' }])('validates native input %p', (input) => {
        expect(() => controller.invoke(input)).toThrow('skills_invalid_request');
        expect(setDraft).not.toHaveBeenCalled();
    });
});
