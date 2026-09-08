export const EVENT_LOOP_INTERVAL_FLAG = 'EventLoopInterval' as const;

export interface SharedUnleashClient {
    isEnabled: (flag: string) => boolean;
    getVariant: (flag: string) => { payload?: { value?: string } };
    on: (event: 'update', handler: () => void) => void;
    off: (event: 'update', handler: () => void) => void;
}

let sharedUnleashClient: SharedUnleashClient | undefined;

export const setSharedUnleashClient = (client: SharedUnleashClient) => {
    sharedUnleashClient = client;
};

export const resetSharedUnleashClient = () => {
    sharedUnleashClient = undefined;
};

export const getSharedUnleashClient = () => sharedUnleashClient;
