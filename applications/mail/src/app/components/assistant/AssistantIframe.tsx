import { c } from 'ttag';

import { getAssistantIframeURL } from '@proton/llm/lib/helpers';
import { useAssistant } from '@proton/llm/lib/hooks/useAssistant';

const AssistantIframe = () => {
    const { canShowAssistant } = useAssistant();

    if (!canShowAssistant) {
        return null;
    }

    return (
        <iframe
            className="hidden"
            id="assistant-iframe"
            title={c('Info').t`writing assistant iframe`}
            src={getAssistantIframeURL()}
            tabIndex={-1}
        />
    );
};

export default AssistantIframe;
