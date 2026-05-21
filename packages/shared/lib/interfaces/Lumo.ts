import type { EventV6Response } from '@proton/shared/lib/api/events';

interface EventV6Defaults {
    More: boolean;
    Refresh: boolean;
    EventID: string;
}

export interface LumoEventResponse extends EventV6Defaults {
    LumoSpaces?: EventV6Response;
    LumoConversations?: EventV6Response;
    LumoMessages?: EventV6Response;
    LumoAssets?: EventV6Response;
    LumoUserSettings?: EventV6Response;
}
