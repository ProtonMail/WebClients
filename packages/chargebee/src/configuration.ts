import { CbIframeConfig } from '../lib/types';

let configuration: CbIframeConfig | null = null;

export function getConfiguration(): CbIframeConfig {
    if (!configuration) {
        throw new Error('Configuration is not set');
    }
    return configuration;
}

export function setConfiguration(_configuration: CbIframeConfig) {
    configuration = _configuration;
}
