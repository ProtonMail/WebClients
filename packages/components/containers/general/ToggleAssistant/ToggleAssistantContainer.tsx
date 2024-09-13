import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight, useUserSettings } from '@proton/components';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import ToggleAssistant from './ToggleAssistant';
import ToggleAssistantEnvironment from './ToggleAssistantEnvironment';

const { OFF, UNSET, SERVER_ONLY } = AI_ASSISTANT_ACCESS;

const ToggleAssistantContainer = () => {
    const assistantFeatureEnabled = useAssistantFeatureEnabled();
    const [{ AIAssistantFlags }] = useUserSettings();

    let aiFlag = AIAssistantFlags;
    if (AIAssistantFlags === UNSET) {
        aiFlag = SERVER_ONLY;
    }

    if (!assistantFeatureEnabled.enabled) {
        return null;
    }

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="assistantSelect" className="flex-1">
                        <span className="text-semibold">{c('Title').t`${BRAND_NAME} Scribe writing assistant`}</span>
                    </label>
                    <Href className="block text-sm" href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}>{c(
                        'Link'
                    ).t`Learn more`}</Href>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <ToggleAssistant id="assistantSelect" aiFlag={aiFlag} />
                </SettingsLayoutRight>
            </SettingsLayout>
            {aiFlag !== OFF && <ToggleAssistantEnvironment aiFlag={AIAssistantFlags} />}
        </>
    );
};

export default ToggleAssistantContainer;
