import { configureStore } from '@reduxjs/toolkit';

import { generateSkillKeyBase64 } from '../crypto';
import { getSkillDek, serializeSkillAsset } from '../features/skills/skillSerialization';
import { loadSkills, resolveSkillContext, setSkillEnabled } from '../features/skills/skillsThunks';
import type { Skill } from '../features/skills/types';
import skills from '../redux/slices/skills';
import type { LumoDispatch } from '../redux/store';
import { createNativeSkillsController } from './nativeComposerSkills';

it('resolves native-invoked plugin instructions and files through the existing web send resolver', async () => {
    const plugin: Skill = {
        id: 'plugin',
        name: 'Plugin',
        description: '',
        instructions: '',
        plugin: {},
        enabled: true,
        source: 'uploaded',
        createdAt: '',
        updatedAt: '',
        skillKey: await generateSkillKeyBase64(),
        subSkills: [{ name: 'chart', path: 'skills/chart', description: '', enabled: true }],
    };
    const dek = await getSkillDek(plugin);
    const assets = await Promise.all(
        [
            ['skills/chart/SKILL.md', '---\nname: chart\ndescription: Charts\n---\nMake a chart using reference.txt'],
            ['skills/chart/reference.txt', 'Use these chart conventions'],
        ].map(async ([path, content], i) =>
            serializeSkillAsset(
                {
                    id: `asset-${i}`,
                    skillId: plugin.id,
                    createdAt: '',
                    updatedAt: '',
                    path,
                    mimeType: 'text/plain',
                    data: new TextEncoder().encode(content),
                },
                dek
            )
        )
    );
    const dbApi = { getSkillAssets: jest.fn(async () => assets) };
    const store = configureStore({
        reducer: { skills },
        middleware: (getDefault) => getDefault({ thunk: { extraArgument: { dbApi } } }),
    });
    store.dispatch(loadSkills.fulfilled({ skills: [plugin], migratedAgentIds: [] }, 'load'));
    const controller = createNativeSkillsController({
        owner: 'account',
        getSource: () => ({
            owner: 'account',
            status: store.getState().skills.status,
            skills: Object.values(store.getState().skills.skills),
        }),
        setDraft: jest.fn(),
        publish: jest.fn(),
    });
    const { text } = controller.invoke({
        revision: controller.refresh().revision,
        id: 'plugin/skills/chart',
        text: 'Please visualize this',
    });
    const dispatch = store.dispatch as LumoDispatch;
    const context = await dispatch(resolveSkillContext({ texts: [text], listFiles: true })).unwrap();
    expect(context.instructions).toContain('Make a chart using reference.txt');
    expect(context.instructions).toContain('[Skill /chart');
    expect(context.readable).toEqual(['chart']);
    expect(context.instructions).toContain('reference.txt');
    expect(dbApi.getSkillAssets).toHaveBeenCalledWith('plugin');
    store.dispatch(
        setSkillEnabled.fulfilled({ ...plugin, enabled: false }, 'disable', { id: plugin.id, enabled: false })
    );
    const disabled = await dispatch(resolveSkillContext({ texts: [text], listFiles: true })).unwrap();
    expect(disabled.instructions).toBeUndefined();
    expect(disabled.readable).toEqual([]);
});
