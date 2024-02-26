import { type FC } from 'react';

import { OrganizationShare } from '@proton/pass/components/Settings/OrganizationShare';

export const Organization: FC = () => {
    return (
        <div className="flex flex-column justify-center w-full h-full">
            <OrganizationShare />
        </div>
    );
};
