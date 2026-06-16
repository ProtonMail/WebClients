import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { getWritingAssistantTitle } from '@proton/components/helpers/assistant';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import ToggleAssistant from './ToggleAssistant';
import ToggleAssistantEnvironment from './ToggleAssistantEnvironment';

const { OFF, UNSET, SERVER_ONLY } = AI_ASSISTANT_ACCESS;

const ToggleAssistantContainer = () => {
    const assistantFeatureEnabled = useAssistantFeatureEnabled();
    const scribeToLumo = useFlag('ScribeToLumo');
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
                        <span className="text-semibold">{getWritingAssistantTitle(scribeToLumo)}</span>
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
