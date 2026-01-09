import type { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { FeatureFlagState } from '@proton/pass/store/reducers/user';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils';
import type { AppState } from '@proton/pass/types/worker/state';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ClientEndpoint =
    | 'popup'
    | 'contentscript'
    | 'background'
    | 'page'
    | 'notification'
    | 'dropdown'
    | 'web'
    | 'desktop'
    | 'offscreen';

export type TabId = number;
export type FrameId = number;
export type WithTabId<T = {}> = T & { tabId: Maybe<TabId> };

export type EndpointContext = {
    /** Parsed URL of the current endpoint. In iframe contexts, this represents
     * the iframe's URL. Use `parentUrl` to access the top-level frame's origin. */
    url: MaybeNull<ParsedUrl>;
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
};
