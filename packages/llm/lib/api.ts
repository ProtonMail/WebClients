export const getAssistantModels = () => ({
    url: 'ai/v1/models',
    method: 'get',
});

type AssistantRequestProps = {
    prompt: string;
    stopStrings?: string[];
    decodeLine?: boolean;
};
export const sendAssistantRequest = (props: AssistantRequestProps) => {
    const Prompt = props.prompt;
    const Stop = props.stopStrings;
    const DecodeLine = props.decodeLine ?? false;
    return {
        url: 'ai/v1/assist',
        method: 'post',
        data: { Prompt, Stop, DecodeLine },
    };
};
