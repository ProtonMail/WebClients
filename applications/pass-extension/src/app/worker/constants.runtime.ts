import browser from '@proton/pass/lib/globals/browser';

export const API_PROXY_PATH = '/api-proxy';
export const API_PROXY_URL = browser?.runtime.getURL(API_PROXY_PATH);
export const API_PROXY_IMAGE_ENDPOINT = '/core/v4/images/logo';
