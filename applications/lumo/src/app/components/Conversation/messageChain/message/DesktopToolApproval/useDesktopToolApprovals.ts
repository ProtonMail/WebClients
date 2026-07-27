import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import type { DesktopConnector, DesktopToolApprovalRequest } from '@proton/lumo-api-client';
import {
    getDesktopConnectors,
    getPendingToolApprovals,
    isDesktopEnvironment,
    resolveToolApproval,
    subscribeToolApprovals,
} from '@proton/lumo-api-client';

export type ResolvedToolApproval = DesktopToolApprovalRequest & {
    connectorName: string;
    toolLabel: string;
};

function resolveRequest(
    request: DesktopToolApprovalRequest,
    connectorsById: Map<string, DesktopConnector>
): ResolvedToolApproval {
    const connector = connectorsById.get(request.connectorId);
    const tool = connector?.tools?.find((t) => t.name === request.toolName);
    return {
        ...request,
        connectorName: connector?.display_name ?? request.connectorId,
        toolLabel: tool?.title ?? request.toolName,
    };
}

export function useDesktopToolApprovals(): {
    approvals: ResolvedToolApproval[];
    approve: (requestId: string) => void;
    reject: (requestId: string) => void;
} {
    const pending = useSyncExternalStore(subscribeToolApprovals, getPendingToolApprovals);
    const [connectorsById, setConnectorsById] = useState<Map<string, DesktopConnector>>(new Map());

    const hasUnknownConnector = pending.some((request) => !connectorsById.has(request.connectorId));
    useEffect(() => {
        if (!isDesktopEnvironment() || !hasUnknownConnector) {
            return;
        }
        let cancelled = false;
        void getDesktopConnectors().then((connectors) => {
            if (cancelled) {
                return;
            }
            setConnectorsById(new Map(connectors.map((connector) => [connector.id, connector])));
        });
        return () => {
            cancelled = true;
        };
    }, [hasUnknownConnector]);

    const approve = useCallback((requestId: string) => resolveToolApproval(requestId, true), []);
    const reject = useCallback((requestId: string) => resolveToolApproval(requestId, false), []);

    const approvals = pending.map((request) => resolveRequest(request, connectorsById));

    return { approvals, approve, reject };
}
