import type { ZoomIntegrationState } from './interface';

const showLoginButtonSet = new Set(['connected', 'disconnected', 'meeting-deleted', 'disconnected-error']);
export const shouldSeeLoginButton = (state?: ZoomIntegrationState) => {
    return state && showLoginButtonSet.has(state);
};

const showLoadingButtonSet = new Set(['loadingConfig', 'loading']);
export const shouldSeeLoadingButton = (state?: ZoomIntegrationState) => {
    return state && showLoadingButtonSet.has(state);
};

const reconnectToZoomButtonSet = new Set(['disconnected-error', 'disconnected']);
export const shouldReconnectToZoom = (state?: ZoomIntegrationState) => {
    return state && reconnectToZoomButtonSet.has(state);
};
