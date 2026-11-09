import { useLayoutEffect } from 'react';

import type { Skill } from '../../../features/skills/types';
import { useSkills } from '../../../features/skills/useSkills';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoStore } from '../../../redux/hooks';
import { isNativeComposerBridgeAvailable } from '../../../remote/nativeComposerBridgeHelpers';
import { createNativeSkillsController } from '../../../remote/nativeComposerSkills';
import { canUseNativeSkills } from '../../../util/userAgent';

/** Lives with the draft owner, not the optional/hidden editor subtree. */
export const useNativeComposerSkillsApi = ({
    accountId,
    context,
    enabled,
    setDraft,
}: {
    accountId: string | undefined;
    context: string;
    enabled: boolean;
    setDraft: (text: string) => void;
}) => {
    const { customAgents, externalTools } = useLumoFlags();
    const available = canUseNativeSkills() && enabled && !!accountId && customAgents && externalTools;
    useSkills({ enabled: available });
    const store = useLumoStore();

    useLayoutEffect(() => {
        if (!isNativeComposerBridgeAvailable()) return;
        const api = (window as any).nativeComposerApiInstance;
        let previousSkills: Record<string, Skill> | undefined;
        let skills: Skill[] = [];
        const controller = createNativeSkillsController({
            owner: accountId ?? '',
            getSource: () => {
                const state = store.getState();
                if (previousSkills !== state.skills.skills) {
                    previousSkills = state.skills.skills;
                    skills = Object.values(previousSkills);
                }
                return {
                    owner: state.user.value?.ID,
                    available: available && !api.getState().editMode.active,
                    status: state.skills.status,
                    skills,
                };
            },
            setDraft,
            publish: (state) => api.setSkills(state),
        });
        const unregister = api.registerSkillsHandler(controller.invoke);
        const unsubscribe = store.subscribe(controller.refresh);
        window.addEventListener('lumo:nativeEditChanged', controller.refresh);
        controller.refresh();
        return () => {
            unsubscribe();
            window.removeEventListener('lumo:nativeEditChanged', controller.refresh);
            controller.dispose();
            unregister();
        };
    }, [store, accountId, context, available, setDraft]);
};
