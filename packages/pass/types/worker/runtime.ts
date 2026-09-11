import type { AuthSession } from '../../lib/auth/session';
import type { ConnectivityStatus } from '../../lib/network/connectivity.utils';
import type { ParsedUrl } from '../../lib/urls/types';
import type { ProxiedSettings } from '../../store/reducers/settings';
import type { FeatureFlagState } from '../../store/reducers/user';
import type { Maybe, MaybeNull } from '../utils';
import type { AppState } from './state';

export type ClientEndpoint =
    'popup' | 'contentscript' | 'background' | 'page' | 'notification' | 'dropdown' | 'web' | 'desktop' | 'offscreen';

export type TabId = number;
export type FrameId = number;
export type WithTabId<T = {}> = T & { tabId: Maybe<TabId> };

export type EndpointContext = {
    /** Parsed URL of the current endpoint. In iframe contexts, this represents
     * the iframe's URL. Use `tabUrl` to access the top-level frame's tab URL. */
    frameUrl: MaybeNull<ParsedUrl>;
    /** Origin of the top-level tab frame. In non-iframe contexts, this
     * matches `url`. */
    tabUrl: MaybeNull<ParsedUrl>;
    /** Tab ID of the active tab where the action originated. When called from
     * the extension popup, this represents the tab that was active when the
     * popup was opened, not the popup's own internal tab ID.  */
    tabId: TabId;
    /** Tab ID of the immediate sender of the message. In popup contexts, this
     * is the popup's own tab ID. In all other contexts, this matches `tabId`. */
    senderTabId: TabId;
    /** FrameID of the current endpoint */
    frameId: FrameId;
};

export type ClientInitResult = {
    state: AppState;
    settings: ProxiedSettings;
    features: FeatureFlagState;
    connectivity: ConnectivityStatus;
    session: Partial<AuthSession>;
};
