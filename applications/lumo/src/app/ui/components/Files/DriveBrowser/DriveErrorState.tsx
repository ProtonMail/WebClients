import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

// interface DriveErrorStateProps {
//     onRetry: () => void;
//     loading: boolean;
// }

export const DriveErrorState: ({ onRetry, loading }: { onRetry: any; loading: any }) => React.JSX.Element = ({
    onRetry,
    loading,
}) => {
    return (
        <div className="flex flex-column flex-nowrap items-center justify-center p-8 text-center h-full">
            <img
                className="w-custom h-custom mx-auto mt-6 mb-6"
                src={lumoDrive}
                alt="Lumo + Proton Drive"
                style={{ '--w-custom': '11.5rem' }}
            />
            <h3 className="color-primary mb-2 text-bold">
                {c('collider_2025: Info').t`${DRIVE_SHORT_APP_NAME} storage not set up yet`}
            </h3>
            <p className="text-md color-weak">
                <span>{c('collider_2025: Info').t`Looks like your ${DRIVE_APP_NAME} hasn't been set up yet.`}</span>
                <br />
                <span>{c('collider_2025: Info')
                    .t`To get started, please open ${DRIVE_APP_NAME} to set up your secure storage.`}</span>
            </p>
            <div className="flex flex-column gap-2">
                <Button onClick={() => window.open('https://drive.proton.me', '_blank')} color="norm">
                    {c('collider_2025: Action').t`Open ${DRIVE_APP_NAME}`}
                </Button>
                <Button onClick={onRetry} shape="ghost" disabled={loading}>
                    {loading ? c('collider_2025: Info').t`Trying...` : c('collider_2025: Action').t`Try again`}
                </Button>
            </div>
        </div>
    );
};
