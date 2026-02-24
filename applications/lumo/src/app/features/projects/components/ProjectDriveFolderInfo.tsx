import React, { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import type {BreadcrumbItem} from "../../../components/Files/DriveBrowser/DriveBreadcrumbs";


interface ProjectDriveFolderInfoProps {
    breadcrumbs: BreadcrumbItem[];
    isRootFolder: boolean;
    onBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
    onCreateFolder: () => void;
    onUpload: () => void;
}

export const ProjectDriveFolderInfo: React.FC<ProjectDriveFolderInfoProps> = ({
    breadcrumbs,
    isRootFolder,
    onBreadcrumbClick,
    onCreateFolder,
    onUpload,
}) => {
    const [breadcrumbDropdownOpen, setBreadcrumbDropdownOpen] = useState(false);
    const breadcrumbDropdownAnchorRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="flex items-start justify-between gap-3 items-center">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2  mb-1 flex-nowrap">
                    <Icon name="brand-proton-drive" size={5} className="color-norm flex-shrink-0" />
                    {breadcrumbs.length > 0 && (
                        <div className="flex flex-column flex-nowrap flex-1">
                            <div className="flex items-center gap-1 color-weak flex-nowrap">
                                {breadcrumbs.length <= 2 ? (
                                    // Show all breadcrumbs if 3 or fewer
                                    breadcrumbs.map((breadcrumb, index) => (
                                        <div
                                            key={breadcrumb.node.nodeUid}
                                            className="flex items-center flex-nowrap shrink-0"
                                        >
                                            <button
                                                onClick={() => onBreadcrumbClick(breadcrumb)}
                                                className={`py-1 rounded hover:bg-gray-100 ${
                                                    index === breadcrumbs.length - 1 ? 'text-bold' : ''
                                                }`}
                                                disabled={index === breadcrumbs.length - 1}
                                            >
                                                {breadcrumb.node.name}
                                            </button>
                                            {index < breadcrumbs.length - 1 && (
                                                <Icon name="chevron-right" size={3} className="color-weak" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Show first, dropdown with middle ones, and last
                                    <>
                                        {/* First breadcrumb */}
                                        <div className="flex items-center flex-nowrap shrink-0">
                                            <button
                                                onClick={() => onBreadcrumbClick(breadcrumbs[0])}
                                                className="py-1 rounded hover:bg-gray-100"
                                                title={breadcrumbs[0].node.name}
                                            >
                                                {breadcrumbs[0].node.name}
                                            </button>
                                            <Icon name="chevron-right" size={3} className="color-weak" />
                                        </div>

                                        {/* Dropdown button for middle breadcrumbs */}
                                        <div className="flex items-center flex-nowrap shrink-0">
                                            <button
                                                ref={breadcrumbDropdownAnchorRef}
                                                onClick={() => setBreadcrumbDropdownOpen(true)}
                                                className="py-1 px-2 rounded hover:bg-gray-100 color-weak"
                                                aria-label={c('collider_2025:Action').t`More breadcrumbs`}
                                                title={c('collider_2025:Action').t`More breadcrumbs`}
                                            >
                                                ...
                                            </button>
                                            <Icon name="chevron-right" size={3} className="color-weak" />
                                        </div>

                                        {/* Last breadcrumb */}
                                        <div className="flex items-center flex-nowrap ">
                                            <button
                                                onClick={() => onBreadcrumbClick(breadcrumbs[breadcrumbs.length - 1])}
                                                className="py-1 rounded hover:bg-gray-100 text-bold text-ellipsis"
                                                disabled={true}
                                                title={breadcrumbs[breadcrumbs.length - 1].node.name}
                                            >
                                                {breadcrumbs[breadcrumbs.length - 1].node.name}
                                            </button>
                                        </div>

                                        {/* Dropdown menu */}
                                        <Dropdown
                                            isOpen={breadcrumbDropdownOpen}
                                            anchorRef={breadcrumbDropdownAnchorRef}
                                            onClose={() => setBreadcrumbDropdownOpen(false)}
                                            className="chat-dropdown-menu"
                                        >
                                            <DropdownMenu>
                                                {breadcrumbs.slice(1, -1).map((breadcrumb) => (
                                                    <DropdownMenuButton
                                                        key={breadcrumb.node.nodeUid}
                                                        className="text-left"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setBreadcrumbDropdownOpen(false);
                                                            onBreadcrumbClick(breadcrumb);
                                                        }}
                                                    >
                                                        {breadcrumb.node.name}
                                                    </DropdownMenuButton>
                                                ))}
                                            </DropdownMenu>
                                        </Dropdown>
                                    </>
                                )}
                            </div>
                            <span className="text-xs color-hint">{c('collider_2025:Info')
                                .t`From ${DRIVE_APP_NAME}`}</span>
                        </div>
                    )}
                    <div className="drive-connection-indicator"></div>
                </div>
            </div>
            {isRootFolder && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onCreateFolder}
                        title={c('collider_2025:Action').t`Create folder`}
                    >
                        <Icon name="folder-plus" size={4} />
                    </Button>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onUpload}
                        title={c('collider_2025:Action').t`Upload file`}
                    >
                        <Icon name="arrow-up-line" size={4} />
                    </Button>
                </div>
            )}
        </div>
    );
};
