import type { ZoomIntegrationState } from './interface';

const showLoadingButtonSet = new Set(['loadingConfig', 'loading']);
export const shouldSeeLoadingButton = (state?: ZoomIntegrationState) => {
    return state && showLoadingButtonSet.has(state);
};

const reconnectToZoomButtonSet = new Set(['disconnected-error', 'disconnected']);
export const shouldReconnectToZoom = (state?: ZoomIntegrationState) => {
    return state && reconnectToZoomButtonSet.has(state);
};
