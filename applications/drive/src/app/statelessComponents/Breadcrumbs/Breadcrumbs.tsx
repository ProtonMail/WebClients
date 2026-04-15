import { useState } from 'react';

import { c } from 'ttag';

import type { BreadcrumbInfo } from '@proton/components/index';
import { CollapsingBreadcrumbs, Loader, useNotifications } from '@proton/components/index';
import truncate from '@proton/utils/truncate';

import { SignatureIcon } from '../../components/SignatureIcon';
import type { BreadcrumbsEvents, CrumbDefinition } from './types';

export interface BreadcrumbsProps {
    loading: boolean;
    crumbs: CrumbDefinition[];
    events: BreadcrumbsEvents;
    createHandleItemDrop?: (newParentNodeUid: string) => (e: React.DragEvent<Element>) => void;
}

export const Breadcrumbs = ({ crumbs, loading, events, createHandleItemDrop }: BreadcrumbsProps) => {
    const [dropTarget, setDropTarget] = useState<string>();
    const { createNotification } = useNotifications();

    if (loading) {
        return <Loader className="py-2 px-3" />;
    }

    const breadcrumbs: BreadcrumbInfo[] = crumbs.map((crumb, index) => {
        const nodeUid = crumb.uid;
        const isLast = index === crumbs.length - 1;
        const handleItemDrop = createHandleItemDrop ? createHandleItemDrop(nodeUid) : undefined;
        return {
            key: crumb.uid,
            text: truncate(crumb.name, 30),
            richText: (
                <span className="flex items-center flex-nowrap flex-1">
                    {crumb.haveSignatureIssues && (
                        <SignatureIcon haveSignatureIssues={crumb.haveSignatureIssues} isFile={false} />
                    )}
                    <span className="text-pre text-ellipsis">{truncate(crumb.name, 30)}</span>
                </span>
            ),
            collapsedText: crumb.name,
            onClick: isLast ? undefined : (crumb.customOnItemClick ?? (() => events.onBreadcrumbItemClick(nodeUid))),

            highlighted: crumb.supportDropOperations && handleItemDrop && crumb.uid === dropTarget,
            onDragLeave: () => {
                if (!handleItemDrop || !crumb.supportDropOperations) {
                    return;
                }
                setDropTarget(undefined);
            },
            onDragOver: (e) => {
                if (!handleItemDrop || !crumb.supportDropOperations) {
                    return;
                }
                e.stopPropagation();
                e.preventDefault();
                if (dropTarget !== nodeUid) {
                    setDropTarget(nodeUid);
                }
            },
            onDrop: async (e) => {
                if (!handleItemDrop || !crumb.supportDropOperations) {
                    return;
                }
                setDropTarget(undefined);
                try {
                    await handleItemDrop(e);
                } catch (e: unknown) {
                    createNotification({
                        text: c('Notification').t`Failed to move, please try again`,
                        type: 'error',
                    });
                    console.error(e);
                }
            },
        };
    });

    return <CollapsingBreadcrumbs breadcrumbs={breadcrumbs} />;
};
