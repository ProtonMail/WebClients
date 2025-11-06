import type { ClientEndpoint, FrameId, TabId } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const generatePortName = (endpoint: ClientEndpoint, tabId: TabId, frameId: FrameId) =>
    `${endpoint}-${tabId}-${frameId}-${uniqueId(16)}`;

export const tabIDFromPortName = (portName: string): TabId => {
    const parts = portName.split('-');
    return parseInt(parts[1], 10);
};

const isEndpointPort = (endpoint: ClientEndpoint) => (portName: string, tabId?: TabId) =>
    portName.startsWith(`${endpoint}-${tabId ?? ''}`);

export const isPopupPort = isEndpointPort('popup');
export const isPagePort = isEndpointPort('page');
export const isContentScriptPort = isEndpointPort('contentscript');
