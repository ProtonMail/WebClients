/**
 * Recharts-free finance helpers (types, formatters, parser).
 *
 * Kept separate from FinanceToolResult/FinanceComparisonResult so that code on the
 * conversation render path (RenderBlocks) can parse finance tool results and reference
 * their types WITHOUT statically pulling in recharts (~341KB decoded). The chart
 * components themselves are lazy-loaded and only fetch recharts when a finance card
 * actually renders.
 */

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
