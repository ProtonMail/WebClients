import React from 'react';

import type { DriveNode } from '../../../hooks/useDriveSDK';
import { LumoIcon } from '../../LumoIcon/LumoIcon';

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
        <div className="flex shrink-0 items-center mb-2 py-2 overflow-x-auto border-b lumo-border">
            {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.node.nodeUid}>
                    <button
                        onClick={() => onBreadcrumbClick(breadcrumb)}
                        className={`px-2 py-1 radius-12 hover:bg-weak transition-all lumo-easing-standard ${
                            breadcrumb.node.nodeUid === currentFolder.nodeUid
                                ? 'lumo-title-small'
                                : 'lumo-body-medium lumo-color-glyph-mid'
                        }`}
                    >
                        {breadcrumb.node.name}
                    </button>
                    {index < breadcrumbs.length - 1 && (
                        <LumoIcon
                            name="ChevronRight"
                            width={12}
                            height={12}
                            className="shrink-0 lumo-color-glyph-mid"
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
