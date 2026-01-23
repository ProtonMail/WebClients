import { useState } from 'react';

import { c } from 'ttag';

import type { BreadcrumbInfo } from '@proton/components/index';
import { CollapsingBreadcrumbs, Loader, useNotifications } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { SignatureIcon } from '../../components/SignatureIcon';
import type { BreadcrumbsEvents, CrumbDefinition } from './types';
import { BreadcrumbRenderingMode } from './types';

export interface BreadcrumbsProps {
    loading: boolean;
    crumbs: CrumbDefinition[];
    events: BreadcrumbsEvents;
    renderingMode?: BreadcrumbRenderingMode;
    createHandleItemDrop?: (newParentNodeUid: string) => (e: React.DragEvent<Element>) => Promise<void>;
}

export const Breadcrumbs = ({
    crumbs,
    loading,
    events,
    createHandleItemDrop,
    renderingMode = BreadcrumbRenderingMode.Inline,
}: BreadcrumbsProps) => {
    const [dropTarget, setDropTarget] = useState<string>();
    const { createNotification } = useNotifications();

    if (loading) {
        return <Loader className="py-2 px-3" />;
    }

    const breadcrumbs: BreadcrumbInfo[] = crumbs.map((crumb) => {
        const nodeUid = crumb.uid;
        const handleItemDrop = createHandleItemDrop ? createHandleItemDrop(nodeUid) : undefined;
        return {
            key: crumb.uid,
            text: crumb.name,
            richText: (
                <span className="flex items-center flex-nowrap flex-1">
                    {crumb.haveSignatureIssues && (
                        <SignatureIcon haveSignatureIssues={crumb.haveSignatureIssues} isFile={false} />
                    )}
                    <span className="text-pre text-ellipsis">{crumb.name}</span>
                </span>
            ),
            collapsedText: crumb.name,
            onClick: crumb.customOnItemClick ?? (() => events.onBreadcrumbItemClick(nodeUid)),

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

    const isProminent = renderingMode === BreadcrumbRenderingMode.Prominent;
    return <CollapsingBreadcrumbs className={clsx(isProminent && 'text-4xl')} breadcrumbs={breadcrumbs} />;
};
