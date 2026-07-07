export const CARD_TYPES = ['metric', 'finding', 'summary'] as const;

export type LumoCardType = (typeof CARD_TYPES)[number];

export type LumoCardDirection = 'up' | 'down' | 'flat';

export type LumoCardSeverity = 'info' | 'warning' | 'critical';

export interface LumoCardSpec {
    type: LumoCardType;
    title: string;
    value?: string;
    delta?: string;
    direction?: LumoCardDirection;
    body?: string;
    tags?: string[];
    severity?: LumoCardSeverity;
}
