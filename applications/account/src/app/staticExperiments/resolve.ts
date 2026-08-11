import {
    isValidFeatureFlagCookieString,
    readFeatureFlagCookieEntries,
    writeFeatureFlagCookieEntries,
} from '@proton/unleash/UnleashCookiesProvider';

import type { StaticExperimentConfig, StaticExperimentsState } from './types';

const getActiveWeights = (config: StaticExperimentConfig, now: number): Record<string, number> | undefined => {
    const due = config.schedule.filter((entry) => new Date(entry.startAt).getTime() <= now);
    if (due.length === 0) {
        return undefined;
    }

    return due.reduce((latest, entry) =>
        new Date(entry.startAt).getTime() > new Date(latest.startAt).getTime() ? entry : latest
    ).weights;
};

const resolveVariant = (weights: Record<string, number>): string | undefined => {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

    if (entries.length === 0 || total <= 0) {
        return;
    }

    const roll = crypto.getRandomValues(new Uint32Array(1))[0] % total;
    let cumulative = 0;
    for (const [variant, weight] of entries) {
        cumulative += weight;
        if (roll < cumulative) {
            return variant;
        }
    }

    return entries[entries.length - 1][0];
};

export const resolveStaticExperiments = (config: Record<string, StaticExperimentConfig>): StaticExperimentsState => {
    const result: StaticExperimentsState = {};
    const cookieEntries = readFeatureFlagCookieEntries();

    for (const name of Object.keys(config)) {
        const experimentConfig = config[name];

        if (!isValidFeatureFlagCookieString(name)) {
            cookieEntries.delete(name);
            result[name] = 'disabled';
            continue;
        }

        const activeWeights = experimentConfig.enabled ? getActiveWeights(experimentConfig, Date.now()) : undefined;

        if (!activeWeights) {
            cookieEntries.delete(name);
            result[name] = 'disabled';
            continue;
        }

        if (!Object.keys(activeWeights).every(isValidFeatureFlagCookieString)) {
            cookieEntries.delete(name);
            result[name] = 'disabled';
            continue;
        }

        const existing = cookieEntries.get(name);

        if (existing !== undefined && existing in activeWeights) {
            result[name] = existing;
            continue;
        }

        const variant = resolveVariant(activeWeights);

        if (variant === undefined) {
            cookieEntries.delete(name);
            result[name] = 'disabled';
            continue;
        }

        cookieEntries.set(name, variant);
        result[name] = variant;
    }

    writeFeatureFlagCookieEntries(cookieEntries);

    return result;
};
