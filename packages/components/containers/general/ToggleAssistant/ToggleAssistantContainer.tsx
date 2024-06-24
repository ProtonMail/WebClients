import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    useOrganization,
    useUserSettings,
} from '@proton/components';
import useAssistantFeatureEnabled from '@proton/components/containers/llm/useAssistantFeatureEnabled';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

import ToggleAssistant from './ToggleAssistant';
import ToggleAssistantEnvironment from './ToggleAssistantEnvironment';

const { OFF, UNSET, SERVER_ONLY } = AI_ASSISTANT_ACCESS;

const ToggleAssistantContainer = () => {
    const assistantFeatureEnabled = useAssistantFeatureEnabled();
    const [{ AIAssistantFlags }] = useUserSettings();
    const [organization] = useOrganization();

    const isVisionary = isOrganizationVisionary(organization);
    let aiFlag = AIAssistantFlags;
    if (AIAssistantFlags === UNSET) {
        aiFlag = isVisionary ? OFF : SERVER_ONLY;
    }

    if (!assistantFeatureEnabled.enabled) {
        return null;
    }

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="assistantSelect" className="flex-1">
                        <span className="text-semibold">{c('Title').t`Writing assistant`}</span>
                    </label>
                    <Href className="block text-sm" href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}>{c(
                        'Link'
                    ).t`Learn more`}</Href>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <ToggleAssistant id="assistantSelect" aiFlag={aiFlag} />
                </SettingsLayoutRight>
            </SettingsLayout>
            {aiFlag !== OFF && <ToggleAssistantEnvironment aiFlag={AIAssistantFlags} />}
        </>
    );
};

export default ToggleAssistantContainer;
