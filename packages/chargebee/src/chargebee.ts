import { ChargebeeInstanceConfiguration } from '../lib';

let chargebee: any | null = null;
export function resetChargebee() {
    chargebee = null;
}

export function createChargebee(config: ChargebeeInstanceConfiguration) {
    if (chargebee) {
        return chargebee;
    }

    const instance = (window as any).Chargebee.init(config);
    chargebee = instance;
    return instance;
}

export function getChargebeeInstance() {
    if (!chargebee) {
        throw new Error('Chargebee is not initialized');
    }

    return chargebee;
}
