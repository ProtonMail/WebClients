export const getAssistantModels = () => ({
    url: 'ai/v1/models',
    method: 'get',
});

export const sendAssistantRequest = (Prompt: string, DecodeLine = false) => ({
    url: 'ai/v1/assist',
    method: 'post',
    data: { Prompt, DecodeLine },
});
