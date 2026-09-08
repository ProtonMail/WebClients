/**
 * Recharts-free finance helpers (types, formatters, parser).
 *
 * Kept separate from FinanceToolResult/FinanceComparisonResult so that code on the
 * conversation render path (RenderBlocks) can parse finance tool results and reference
 * their types WITHOUT statically pulling in recharts (~341KB decoded). The chart
 * components themselves are lazy-loaded and only fetch recharts when a finance card
 * actually renders.
 */

import { isCryptocurrencyToolCallData, isStockToolCallData, tryParseToolCall } from '../../../../../../lib/toolCall/types';
import type { ContentBlock, ToolCallBlock, ToolResultBlock } from '../../../../../../types';
import { isToolCallBlock, isToolResultBlock } from '../../../../../../types';

export interface MonthlyPoint {
    date: string;
    price: number;
    volume: number;
}

export interface CompanyInfo {
    name: string;
    description?: string;
    exchange?: string;
    industry?: string;
    sector?: string;
    market_cap?: number;
    pe_ratio?: number;
    profit_margin?: number;
    dividend_yield?: number;
    revenue_ttm?: number;
}

export interface FinanceData {
    type: 'Stock' | 'Cryptocurrency' | string;
    current_price: number;
    monthly_trend: MonthlyPoint[];
    company_info?: CompanyInfo;
}

export interface FinanceComparisonItem {
    data: FinanceData;
    symbol: string;
}

export const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000_000) {
        return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
};

export const formatVolume = (value: number): string => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(0)}K`;
    }
    return `${value}`;
};

export const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
};

export const formatPrice = (value: number): string => {
    if (value >= 1000) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(2)}`;
};

export const formatShortDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatLastUpdated = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const parseFinanceResult = (result: string): FinanceData | null => {
    try {
        const parsed = JSON.parse(result);
        if (
            typeof parsed.current_price === 'number' &&
            Array.isArray(parsed.monthly_trend) &&
            parsed.monthly_trend.length > 0
        ) {
            return parsed as FinanceData;
        }
    } catch {
        // Not valid JSON or not finance format
    }
    return null;
};

function readStringField(parsed: unknown, field: string): string | undefined {
    if (typeof parsed !== 'object' || parsed === null) {
        return undefined;
    }
    const value = (parsed as Record<string, unknown>)[field];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function tryParseJSON(jsonString: string): unknown {
    try {
        return JSON.parse(jsonString);
    } catch {
        return undefined;
    }
}

function getToolCallBlockId(block: ToolCallBlock): string | undefined {
    const fromToolCall = block.toolCall;
    return readStringField(fromToolCall, 'id') ?? readStringField(fromToolCall, 'call_id') ?? readStringField(tryParseJSON(block.content), 'id') ?? readStringField(tryParseJSON(block.content), 'call_id');
}

function getFinanceSymbolFromCall(block: ToolCallBlock): string | undefined {
    const parsed = tryParseToolCall(block.content);
    if (!parsed || (!isStockToolCallData(parsed) && !isCryptocurrencyToolCallData(parsed))) {
        return undefined;
    }

    const symbol = parsed.arguments.symbol;
    return symbol.trim().length > 0 ? symbol.trim() : undefined;
}

function getFinanceResultBlocks(blocks: ContentBlock[]): ToolResultBlock[] {
    return blocks.filter(
        (block): block is ToolResultBlock =>
            isToolResultBlock(block) && parseFinanceResult(block.content) !== null
    );
}

function findFinanceResultForCall(
    call: ToolCallBlock,
    financeCalls: ToolCallBlock[],
    financeResults: ToolResultBlock[]
): ToolResultBlock | undefined {
    const claimed = new Set<ToolResultBlock>();

    for (const candidateCall of financeCalls) {
        const callId = getToolCallBlockId(candidateCall);
        const result =
            (callId && financeResults.find((block) => block.tool_call_id === callId && !claimed.has(block))) ||
            financeResults.find((block) => !claimed.has(block));

        if (candidateCall === call) {
            return result;
        }

        if (result) {
            claimed.add(result);
        }
    }

    return undefined;
}

/**
 * Collect stock/crypto results for the comparison card directly from message blocks.
 * Does not rely on per-step tool-call pairing, so parallel lookups still compare even
 * when call/result ids are missing or mismatched.
 */
export function collectFinanceComparisonItems(blocks: ContentBlock[]): FinanceComparisonItem[] {
    const financeCalls = blocks.filter(isToolCallBlock).filter((block) => getFinanceSymbolFromCall(block) !== undefined);
    const financeResults = getFinanceResultBlocks(blocks);

    return financeCalls.flatMap((call) => {
        const symbol = getFinanceSymbolFromCall(call);
        if (!symbol) {
            return [];
        }

        const resultBlock = findFinanceResultForCall(call, financeCalls, financeResults);
        const data = resultBlock ? parseFinanceResult(resultBlock.content) : null;
        if (!data) {
            return [];
        }

        return [{ data, symbol }];
    });
}
