import { c } from 'ttag';

import { ASSISTANT_FEATURE_NAME, getAssistantIframeURL, useAssistant } from '@proton/llm/lib';

const AssistantIframe = () => {
    const { canShowAssistant, hasCompatibleHardware, hasCompatibleBrowser, isModelDownloaded } = useAssistant();
    const renderAssistantIframe =
        canShowAssistant && hasCompatibleHardware && hasCompatibleBrowser && !isModelDownloaded;

    if (!renderAssistantIframe) {
        return null;
    }

    return (
        <iframe
            className="hidden"
            id="assistant-iframe"
            title={c('loc_nightly_assistant').t`${ASSISTANT_FEATURE_NAME} iframe`}
            src={getAssistantIframeURL()}
            tabIndex={-1}
        />
    );
};

export default AssistantIframe;
