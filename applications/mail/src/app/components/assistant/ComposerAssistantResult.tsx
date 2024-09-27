import { useAssistant } from '@proton/llm/lib';

import { parseModelResult } from 'proton-mail/helpers/assistant/result';

import './ComposerAssistantResult.scss';

interface Props {
    result: string;
    assistantID: string;
    isComposerPlainText: boolean;
    messageID: string;
}

const HTMLResult = ({ result, messageID }: { result: string; messageID: string }) => {
    const sanitized = parseModelResult(result, messageID);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} className="composer-assistant-result"></div>;
};

const ComposerAssistantResult = ({ result, assistantID, isComposerPlainText, messageID }: Props) => {
    const { isGeneratingResult, canKeepFormatting } = useAssistant(assistantID);

    if (isGeneratingResult || isComposerPlainText || !canKeepFormatting) {
        return <div>{result}</div>;
    }
    // We transform and clean the result after generation completed to avoid costly operations (markdown to html, sanitize)
    return <HTMLResult result={result} messageID={messageID} />;
};

export default ComposerAssistantResult;
