import type {
    DesktopExternalTools,
    DesktopToolApprovalRequest,
    DesktopToolApprovalResolved,
    LumoConnectorsApi,
} from './desktop-tools';

declare global {
    interface Window {
        __TAURI__?: {
            external_tools?: DesktopExternalTools;
        };
        LumoConnectors?: LumoConnectorsApi;
    }
    interface WindowEventMap {
        'lumo:tool-approval-request': CustomEvent<DesktopToolApprovalRequest>;
        'lumo:tool-approval-resolved': CustomEvent<DesktopToolApprovalResolved>;
    }
}

export {};
