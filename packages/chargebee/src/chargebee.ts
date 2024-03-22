import { ChargebeeInstanceConfiguration } from '../lib';
import { addCheckpoint } from './checkpoints';

let chargebee: any | null = null;
export function resetChargebee() {
    chargebee = null;
}

export function createChargebee(config: ChargebeeInstanceConfiguration) {
    try {
        if (chargebee) {
            return chargebee;
        }

        addCheckpoint('chargebee.init', config);
        const instance = (window as any).Chargebee.init(config);
        addCheckpoint('chargebee.init.done');
        chargebee = instance;
        return instance;
    } catch (error: any) {
        addCheckpoint('chargebee.init.error', {
            message: error?.message,
            stack: error?.stack,
        });
        throw error;
    }
}

export function getChargebeeInstance() {
    if (!chargebee) {
        throw new Error('Chargebee is not initialized');
    }

    return chargebee;
}

export function isChargebeeLoaded(): boolean {
    return !!(window as any).Chargebee;
}

export async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollUntilLoaded(): Promise<void> {
    const timeStep = 500;
    const maxTime = 55000;

    let timeElapsed = 0;
    while (timeElapsed < maxTime) {
        if (isChargebeeLoaded()) {
            addCheckpoint('chargebee.loaded', {
                timeElapsed,
            });
            return;
        }
        await wait(timeStep);
        timeElapsed += timeStep;
    }

    throw new Error('Chargebee did not load');
}
