import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { TransitionSlot } from '@proton/atoms/TransitionSlot/TransitionSlot';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import clsx from '@proton/utils/clsx';

export const LoadAndSuccessTransition = ({ created }: { created: boolean }) => (
    <div className="absolute inset-0 flex flex-column items-center justify-center gap-2 text-center">
        <TransitionSlot
            activeKey={created ? 'done' : 'loading'}
            items={{
                loading: <CircleLoader size="large" />,
                done: <IcCheckmarkCircleFilled size={12} className="color-success" />,
            }}
        />
        <div className={clsx('flex flex-column gap-1', !created && 'visibility-hidden')}>
            <h2 className="text-2xl text-semibold">{c('Title').t`Created!`}</h2>
            <span className="color-weak">{c('Info').t`Your Always-on VPN device profile is ready to deploy.`}</span>
        </div>
    </div>
);
