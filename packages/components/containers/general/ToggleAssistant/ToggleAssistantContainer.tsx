import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces/UserSettings';
import { useFlag } from '@proton/unleash/useFlag';

import { getWritingAssistantTitle } from '../../../helpers/assistant';
import useAssistantFeatureEnabled from '../../../hooks/assistant/useAssistantFeatureEnabled';
import { SettingsToggleRow } from '../../account/SettingsToggleRow';
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
        <div className="flex flex-column gap-4">
            <SettingsToggleRow
                id="assistantSelect"
                label={
                    <>
                        <SettingsToggleRow.Label>{getWritingAssistantTitle(scribeToLumo)}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            <Href href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}>
                                {c('Link').t`Learn more`}
                            </Href>
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<ToggleAssistant id="assistantSelect" aiFlag={aiFlag} />}
            />
            {aiFlag !== OFF && <ToggleAssistantEnvironment aiFlag={AIAssistantFlags} optionClassName="mb-0" />}
        </div>
    );
};

export default ToggleAssistantContainer;
