import { c } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import clsx from '@proton/utils/clsx';

/** Upsell for users who can't upgrade the plan themselves, e.g. organization members */
const ContactAdminUpsell = ({ className }: { className?: string }) => (
    <Card bordered={false} rounded className={clsx('flex flex-nowrap gap-2', className)}>
        <div className="shrink-0">
            <IcInfoCircle className="color-primary" />
        </div>
        <div className="flex-1">
            {c('Info').t`This feature is not supported in your plan. Contact your admin to gain access.`}
        </div>
    </Card>
);

export default ContactAdminUpsell;
