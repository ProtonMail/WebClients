import type { ProtonConfig } from '@proton/shared/lib/interfaces';

let workerConfig: ProtonConfig | undefined;

export const setWorkerConfig = (config: ProtonConfig) => {
    workerConfig = config;
};

export const getWorkerConfig = () => workerConfig;
