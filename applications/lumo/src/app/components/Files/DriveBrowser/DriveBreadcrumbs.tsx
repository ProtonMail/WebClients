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
        <div className="flex items-center py-2 mb-2 border-b border-weak shrink-0 overflow-x-auto">
            {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.node.nodeUid}>
                    <button
                        onClick={() => onBreadcrumbClick(breadcrumb)}
                        className={`text-sm px-2 py-1 rounded-lg hover:bg-weak transition-all ${
                            breadcrumb.node.nodeUid === currentFolder.nodeUid ? 'text-bold' : 'color-weak'
                        }`}
                    >
                        {breadcrumb.node.name}
                    </button>
                    {index < breadcrumbs.length - 1 && <IcChevronRight size={3} className="color-weak shrink-0" />}
                </React.Fragment>
            ))}
        </div>
    );
};
