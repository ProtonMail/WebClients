import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import ToggleAssistant from './ToggleAssistant';
import ToggleAssistantEnvironment from './ToggleAssistantEnvironment';

// This toggle allow users to enable or disable the writing assistant
// Moreover, they can choose to select between server and client side
const ToggleAssistantContainer = () => {
    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="assistantSelect" className="flex-1">
                        <span className="text-semibold">{c('Title').t`Enable writing assistant`}</span>
                    </label>
                    <Href
                        className="block text-sm"
                        href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant#local-or-server')}
                    >{c('Link').t`Learn more`}</Href>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <ToggleAssistant id="assistantSelect" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <ToggleAssistantEnvironment />
        </>
    );
};

export default ToggleAssistantContainer;
