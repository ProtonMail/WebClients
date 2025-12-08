import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

interface DriveEmptyStateProps {
    onUpload: () => void;
    loading?: boolean;
    isRefreshing?: boolean;
    disabled?: boolean;
}

export const DriveEmptyState: React.FC<DriveEmptyStateProps> = ({
    onUpload,
    loading = false,
    isRefreshing = false,
    disabled = false,
}) => {
    return (
        <div className="text-center py-8 text-gray-500">
            <img
                className="w-custom h-custom mx-auto mt-6 mb-6"
                src={lumoDrive}
                alt="Lumo + Proton Drive"
                style={{ '--w-custom': '11.5rem' } as React.CSSProperties}
            />
            <p>{c('collider_2025: Info').t`This folder is empty`}</p>

            <Button
                onClick={onUpload}
                size="medium"
                color="norm"
                disabled={loading || isRefreshing || disabled}
                title={c('collider_2025: Action').t`Upload file and add to knowledge base`}
            >
                <IcArrowUpLine /> {c('collider_2025: Action').t`Upload a file`}
            </Button>
        </div>
    );
};
