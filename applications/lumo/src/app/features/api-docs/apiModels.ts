export interface ApiModel {
    id: string;
    name: string;
    description: string;
    maxContextLength: number;
    capabilities: {
        completionChat: boolean;
        functionCalling: boolean;
        vision: boolean;
    };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseModel = (value: unknown): (ApiModel & { archived: boolean }) | undefined => {
    if (!isRecord(value) || !isRecord(value.capabilities)) {
        return;
    }

    const { capabilities } = value;
    if (
        value.object !== 'model' ||
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        typeof value.description !== 'string' ||
        typeof value.max_context_length !== 'number' ||
        !Number.isSafeInteger(value.max_context_length) ||
        value.max_context_length <= 0 ||
        typeof value.archived !== 'boolean' ||
        typeof capabilities.completion_chat !== 'boolean' ||
        typeof capabilities.function_calling !== 'boolean' ||
        typeof capabilities.vision !== 'boolean'
    ) {
        return;
    }

    return {
        id: value.id,
        name: value.name,
        description: value.description,
        maxContextLength: value.max_context_length,
        archived: value.archived,
        capabilities: {
            completionChat: capabilities.completion_chat,
            functionCalling: capabilities.function_calling,
            vision: capabilities.vision,
        },
    };
};

export const parseApiModelsResponse = (value: unknown): ApiModel[] => {
    if (!isRecord(value) || value.object !== 'list' || !Array.isArray(value.data)) {
        throw new Error('Invalid models response');
    }

    const models: (ApiModel & { archived: boolean })[] = [];
    for (const item of value.data) {
        const model = parseModel(item);
        if (!model) {
            throw new Error('Invalid model in models response');
        }
        models.push(model);
    }

    return models
        .filter((model) => !model.archived)
        .map(({ id, name, description, maxContextLength, capabilities }) => ({
            id,
            name,
            description,
            maxContextLength,
            capabilities,
        }));
};

export const fetchApiModels = async (apiBaseUrl: string, signal?: AbortSignal): Promise<ApiModel[]> => {
    const response = await fetch(`${apiBaseUrl}/models`, {
        headers: { Accept: 'application/json' },
        signal,
    });

    if (!response.ok) {
        throw new Error(`Models request failed with status ${response.status}`);
    }

    return parseApiModelsResponse(await response.json());
};
