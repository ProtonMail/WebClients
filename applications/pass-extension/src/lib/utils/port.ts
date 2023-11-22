import type { ClientEndpoint, TabId } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const generatePortName = (endpoint: ClientEndpoint, tabId: TabId) => `${endpoint}-${tabId}-${uniqueId(16)}`;

const isEndpointPort = (endpoint: ClientEndpoint) => (tabId?: TabId) => (portName: string) =>
    portName.startsWith(`${endpoint}-${tabId ?? ''}`);

export const isPopupPort = isEndpointPort('popup');
export const isContentScriptPort = isEndpointPort('contentscript');
