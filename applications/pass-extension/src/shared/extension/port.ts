import type { ExtensionEndpoint, TabId } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';

export const generatePortName = (endpoint: ExtensionEndpoint, tabId: TabId) => `${endpoint}-${tabId}-${uniqueId(16)}`;

const isEndpointPort = (endpoint: ExtensionEndpoint) => (tabId?: TabId) => (portName: string) =>
    portName.startsWith(`${endpoint}-${tabId ?? ''}`);

export const isPopupPort = isEndpointPort('popup');
export const isContentScriptPort = isEndpointPort('contentscript');
