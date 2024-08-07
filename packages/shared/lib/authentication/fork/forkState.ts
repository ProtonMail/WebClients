import { getAppHref } from '../../apps/helper';
import type { APP_NAMES } from '../../constants';
import { getPathFromLocation } from '../../helpers/url';
import { ForkType } from './constants';
import type { ConsumeForkParameters } from './getConsumeForkParameters';

export const getCurrentUrl = ({ forkType, fromApp }: { forkType?: ForkType; fromApp: APP_NAMES }) => {
    if (forkType === ForkType.SWITCH) {
        return getAppHref('/', fromApp, undefined, window.location);
    }
    return window.location.href;
};

export const getParsedCurrentUrl = (value: string) => {
    try {
        const url = new URL(value, window.location.origin);
        return getPathFromLocation(url);
    } catch {
        return '';
    }
};

export interface ForkState {
    url: string;
    returnUrl?: string;
}

export const setForkStateData = (stateKey: string, data?: ForkState) => {
    sessionStorage.setItem(`f${stateKey}`, JSON.stringify(data));
};

export const getForkStateData = (stateKey: string, parameters: ConsumeForkParameters): ForkState => {
    const defaultForkState: ForkState = {
        url: parameters.returnUrl || '',
        returnUrl: '',
    };

    try {
        const data = sessionStorage.getItem(`f${stateKey}`);

        // Ignore if this fork request wasn't initiated from here, CSRF protection lives in the API
        if (!data) {
            return defaultForkState;
        }
        const { url, returnUrl } = JSON.parse(data);
        return {
            url,
            returnUrl,
        };
    } catch (e: any) {
        return defaultForkState;
    }
};
