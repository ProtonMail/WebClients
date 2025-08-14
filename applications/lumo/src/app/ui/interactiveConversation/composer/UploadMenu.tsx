import React, { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcArrowUpLine, IcBrandProtonDriveFilled } from '@proton/icons';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

export const UploadMenu: ({
    isOpen,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
    buttonRef,
}: {
    isOpen: any;
    onClose: any;
    onUploadFromComputer: any;
    onBrowseDrive: any;
    buttonRef: any;
}) => null | React.JSX.Element = ({ isOpen, onClose, onUploadFromComputer, onBrowseDrive, buttonRef }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, buttonRef]);

    // Close menu on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="upload-menu absolute z-50 bg-norm border border-weak rounded-lg shadow-lifted py-2 min-w-custom"
            style={{
                '--min-w-custom': '200px',
                bottom: '100%',
                left: '0',
                marginBottom: '8px',
            }}
        >
            <Button
                className="w-full justify-start px-4 py-3 hover:bg-weak text-left"
                shape="ghost"
                onClick={() => {
                    onBrowseDrive();
                    onClose();
                }}
            >
                <div className="flex items-center gap-3">
                    <IcBrandProtonDriveFilled size={5} className="text-purple-500" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">
                            {c('collider_2025: Action').t`Add from ${DRIVE_APP_NAME}`}
                        </span>
                    </div>
                </div>
            </Button>

            <Button
                className="w-full justify-start px-4 py-3 hover:bg-weak text-left"
                shape="ghost"
                onClick={() => {
                    onUploadFromComputer();
                    onClose();
                }}
            >
                <div className="flex items-center gap-3">
                    <IcArrowUpLine size={5} className="text-gray-600" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">{c('collider_2025: Action').t`Upload from device`}</span>
                    </div>
                </div>
            </Button>
        </div>
    );
};
