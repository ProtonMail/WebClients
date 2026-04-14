import type { FC } from 'react';

import { c } from 'ttag';

import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { Card } from '@proton/pass/components/Layout/Card/Card';

export const ContactAdminWarning: FC = () => {
    return (
        <Card className="flex items-center flex-nowrap w-full gap-3" type="primary">
            <IcInfoCircleFilled size={5} className="shrink-0 mt-0.5" />
            <span className="text-left">{c('Info').t`Please contact your administrator`}</span>
        </Card>
    );
};
