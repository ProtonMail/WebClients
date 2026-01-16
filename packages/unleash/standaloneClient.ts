import type UnleashClient from './UnleashClient';

let unleashClient: UnleashClient | undefined;

export const setStandaloneUnleashClient = (client: UnleashClient) => {
    if (unleashClient) {
        return;
    }

    unleashClient = client;
};

export const getStandaloneUnleashClient = () => {
    return unleashClient;
};
