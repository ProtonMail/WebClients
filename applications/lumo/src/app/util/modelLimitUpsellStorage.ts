export type ExhaustedModel = 'lite' | 'max';

const getDismissStorageKey = (model: ExhaustedModel) => `lumo-model-limit-upsell-dismissed-${model}`;

export const hasDismissedModelLimitUpsell = (model: ExhaustedModel): boolean => {
    try {
        return sessionStorage.getItem(getDismissStorageKey(model)) === '1';
    } catch {
        return false;
    }
};

export const markModelLimitUpsellDismissed = (model: ExhaustedModel): void => {
    try {
        sessionStorage.setItem(getDismissStorageKey(model), '1');
    } catch {
        // Fail silently if sessionStorage is unavailable.
    }
};
