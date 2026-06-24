export type ToolCallData =
    | WebSearchToolCallData
    | WebExtractToolCallData
    | DescribeImageToolCallData
    | GenerateImageToolCallData
    | EditImageToolCallData
    | ProtonInfoToolCallData
    | WeatherToolCallData
    | StockToolCallData
    | CryptocurrencyToolCallData;
export type ToolCallName = ToolCallData['name'];

export function isToolCallData(data: unknown): data is ToolCallData {
    return (
        isWebSearchToolCallData(data) ||
        isWebExtractToolCallData(data) ||
        isDescribeImageToolCallData(data) ||
        isGenerateImageToolCallData(data) ||
        isEditImageToolCallData(data) ||
        isProtonInfoToolCallData(data) ||
        isWeatherToolCallData(data) ||
        isStockToolCallData(data) ||
        isCryptocurrencyToolCallData(data)
    );
}

export type WebSearchToolCallData = { name: 'web_search'; arguments: WebSearchArguments };

export type WebExtractToolCallData = { name: 'web_extract'; arguments: WebSearchArguments };

export function isWebSearchToolCallData(data: unknown): data is WebSearchToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'web_search') &&
        ('arguments' in data && isWebSearchArguments(data.arguments))
    );
}

export function isWebExtractToolCallData(data: unknown): data is WebExtractToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'web_extract') &&
        ('arguments' in data && isWebSearchArguments(data.arguments))
    );
}

export type WebSearchArguments = {
    query: string;
    urls?: string[];
};

export function isWebSearchArguments(args: unknown): args is WebSearchArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('query' in args && typeof args.query === 'string')
    );
}

export type DescribeImageToolCallData = { name: 'describe_image'; arguments: DescribeImageArguments };

export function isDescribeImageToolCallData(data: unknown): data is DescribeImageToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'describe_image') &&
        ('arguments' in data && isDescribeImageArguments(data.arguments))
    );
}

export type DescribeImageArguments = {
    image_id: string;
    question?: string | null;
};

export function isDescribeImageArguments(args: unknown): args is DescribeImageArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('image_id' in args && typeof args.image_id === 'string') &&
        (!('question' in args) || args.question === null || args.question === undefined || typeof args.question === 'string')
    );
}

export type GenerateImageToolCallData = { name: 'generate_image'; arguments: GenerateImageArguments };

export function isGenerateImageToolCallData(data: unknown): data is GenerateImageToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'generate_image') &&
        ('arguments' in data && isGenerateImageArguments(data.arguments))
    );
}

export type GenerateImageArguments = {
    negative_prompt?: string | null;
    output_format?: string | null;
    prompt: string;
    seed?: number | null;
};

export function isGenerateImageArguments(args: unknown): args is GenerateImageArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        (!('negative_prompt' in args) || args.negative_prompt === null || args.negative_prompt === undefined || typeof args.negative_prompt === 'string') &&
        (!('output_format' in args) || args.output_format === null || args.output_format === undefined || typeof args.output_format === 'string') &&
        ('prompt' in args && typeof args.prompt === 'string') &&
        (!('seed' in args) || args.seed === null || args.seed === undefined || typeof args.seed === 'number')
    );
}

export type EditImageToolCallData = { name: 'edit_image'; arguments: EditImageArguments };

export function isEditImageToolCallData(data: unknown): data is EditImageToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'edit_image') &&
        ('arguments' in data && isEditImageArguments(data.arguments))
    );
}

export type EditImageArguments = {
    image: string[];
    prompt: string;
    cfg_scale?: number | null;
    seed?: number | null;
};

export function isEditImageArguments(args: unknown): args is EditImageArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('image' in args && Array.isArray(args.image) && args.image.every((id) => typeof id === 'string')) &&
        ('prompt' in args && typeof args.prompt === 'string') &&
        (!('cfg_scale' in args) || args.cfg_scale === null || args.cfg_scale === undefined || typeof args.cfg_scale === 'number') &&
        (!('seed' in args) || args.seed === null || args.seed === undefined || typeof args.seed === 'number')
    );
}

export type ProtonInfoToolCallData = { name: 'proton_info' };

export function isProtonInfoToolCallData(data: unknown): data is ProtonInfoToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'proton_info')
    );
}

export type WeatherToolCallData = { name: 'weather'; arguments: WeatherArguments };

export function isWeatherToolCallData(data: unknown): data is WeatherToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'weather') &&
        ('arguments' in data && isWeatherArguments(data.arguments))
    );
}

export type WeatherLocation = { city: string; country_code?: string | null } | { lat: number; lon: number };

export type WeatherArguments = {
    location: WeatherLocation;
};

export function isWeatherArguments(args: unknown): args is WeatherArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('location' in args && isWeatherLocation(args.location))
    );
}

export function isWeatherLocation(location: unknown): location is WeatherLocation {
    if (typeof location !== 'object' || location === null) {
        return false;
    }

    // Check if it's the city variant
    if ('city' in location && typeof location.city === 'string') {
        return (
            !('country_code' in location) ||
            location.country_code === null ||
            location.country_code === undefined ||
            typeof location.country_code === 'string'
        );
    }

    // Check if it's the coordinates variant
    if ('lat' in location && 'lon' in location) {
        return typeof location.lat === 'number' && typeof location.lon === 'number';
    }

    return false;
}

export type StockToolCallData = { name: 'stock'; arguments: StockArguments };

export function isStockToolCallData(data: unknown): data is StockToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'stock') &&
        ('arguments' in data && isStockArguments(data.arguments))
    );
}

export type StockArguments = {
    symbol: string;
    days?: number | null;
};

export function isStockArguments(args: unknown): args is StockArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('symbol' in args && typeof args.symbol === 'string') &&
        (!('days' in args) || args.days === null || args.days === undefined || typeof args.days === 'number')
    );
}

export type CryptocurrencyToolCallData = { name: 'cryptocurrency'; arguments: CryptocurrencyArguments };

export function isCryptocurrencyToolCallData(data: unknown): data is CryptocurrencyToolCallData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('name' in data && data.name === 'cryptocurrency') &&
        ('arguments' in data && isCryptocurrencyArguments(data.arguments))
    );
}

export type CryptocurrencyArguments = {
    symbol: string;
    currency: string;
};

export function isCryptocurrencyArguments(args: unknown): args is CryptocurrencyArguments {
    // prettier-ignore
    return (
        typeof args === 'object' &&
        args !== null &&
        ('symbol' in args && typeof args.symbol === 'string') &&
        ('currency' in args && typeof args.currency === 'string')
    );
}

export type ToolResultData = WebSearchToolResultData | ToolResultError;

export function isToolResultData(data: unknown): data is ToolResultData {
    return isWebSearchToolResultData(data) || isToolResultError(data);
}

export type WebSearchToolResultData = {
    results: SearchItem[];
};

export function isWebSearchToolResultData(data: unknown): data is WebSearchToolResultData {
    // prettier-ignore
    return (
        typeof data === 'object' &&
        data !== null &&
        ('results' in data &&
            Array.isArray(data.results) &&
            data.results.every((item) => isSearchItem(item)))
    );
}

export type SearchItem = {
    title: string;
    description?: string;
    url: string;
    extra_snippets?: string[];
};

export function isSearchItem(item: unknown): item is SearchItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        typeof item.title === 'string' &&
        (!('description' in item) || item.description === undefined || typeof item.description === 'string') &&
        'url' in item &&
        typeof item.url === 'string' &&
        (!('extra_snippets' in item) ||
            item.extra_snippets === undefined ||
            (Array.isArray(item.extra_snippets) && item.extra_snippets.every((snippet) => typeof snippet === 'string')))
    );
}

export type ToolResultError = {
    error: boolean;
};

export function isToolResultError(data: unknown): data is ToolResultError {
    return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'boolean';
}

/**
 * Normalize legacy / OpenAI-adapted tool call payloads into the shape expected by
 * {@link isToolCallData}. The chat-completions stream adapter can emit `parameters`
 * (legacy delta path) or `arguments` (server-side tool calls), and arguments may be a
 * partial JSON string while streaming.
 *
 * It also lets the "announce" chunk of a server-side tool call render an in-progress
 * state: a name-only `web_search`/`web_extract` payload is given an empty `query` so it
 * validates before the arguments arrive. Other tools (weather, stock, ...) require
 * specific arguments, so their announce chunk still renders nothing until the matching
 * "dispatch" chunk replaces it — that's an accepted, minor limitation, not a bug.
 */
function normalizeToolCallPayload(parsed: unknown): unknown {
    if (typeof parsed !== 'object' || parsed === null) {
        return parsed;
    }

    const obj = parsed as Record<string, unknown>;
    const name = obj.name;
    if (typeof name !== 'string') {
        return parsed;
    }

    let args: unknown = obj.arguments ?? obj.parameters ?? {};
    if (typeof args === 'string' && args.length > 0) {
        try {
            args = JSON.parse(args);
        } catch {
            // Keep streaming partial argument fragments as-is.
        }
    }

    if (typeof args === 'object' && args !== null) {
        const argsObj = args as Record<string, unknown>;
        if (name === 'web_search' || name === 'web_extract') {
            if (typeof argsObj.query !== 'string') {
                args = { ...argsObj, query: '' };
            }
        }
    } else if (name === 'web_search' || name === 'web_extract') {
        args = { query: '' };
    }

    return { name, arguments: args };
}

export function tryParseToolCall(toolCall: string): ToolCallData | null {
    if (!toolCall) {
        return null;
    }
    try {
        const parsed = normalizeToolCallPayload(JSON.parse(toolCall));
        return isToolCallData(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function tryParseToolResult(toolResult: string): ToolResultData | null {
    if (!toolResult) {
        return null;
    }
    try {
        console.log('Trying to parse tool result: ', toolResult);
        const parsed = JSON.parse(toolResult);
        return isToolResultData(parsed) ? parsed : null;
    } catch (e) {
        console.log('Failed to parse tool result: ', e);
        return null;
    }
}
