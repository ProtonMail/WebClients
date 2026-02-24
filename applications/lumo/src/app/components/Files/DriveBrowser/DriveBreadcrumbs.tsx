import React from 'react';

import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import type { DriveNode } from '../../../hooks/useDriveSDK';

export interface BreadcrumbItem {
    node: DriveNode;
    index: number;
}

interface DriveBreadcrumbsProps {
    breadcrumbs: BreadcrumbItem[];
    currentFolder: DriveNode;
    onBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
}

export const DriveBreadcrumbs: React.FC<DriveBreadcrumbsProps> = ({
    breadcrumbs,
    currentFolder,
    onBreadcrumbClick,
}) => {
    return (
        <div className="items-center py-2 border-b bg-gray-50 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={breadcrumb.node.nodeUid}>
                            <button
                                onClick={() => onBreadcrumbClick(breadcrumb)}
                                className={`text-sm px-2 py-1 rounded hover:bg-gray-200 ${
                                    breadcrumb.node.nodeUid === currentFolder.nodeUid ? 'text-bold' : 'color-weak'
                                }`}
                            >
                                {breadcrumb.node.name}
                            </button>
                            {index < breadcrumbs.length - 1 && <IcChevronRight size={3} className="color-weak" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
