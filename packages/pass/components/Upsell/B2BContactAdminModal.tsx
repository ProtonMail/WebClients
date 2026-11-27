import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import onboardingSVG from '../../assets/onboarding.svg';
import { type AdapativeModalProps, AdaptiveModal } from '../Layout/Modal/AdaptiveModal';

type Props = Omit<AdapativeModalProps, 'actions'>;

/** Only the organization admin can upgrade a B2B plan */
export const B2BContactAdminModal: FC<Props> = ({ size = 'medium', ...props }) => (
    <AdaptiveModal
        {...props}
        size={size}
        actions={[
            <Button key="close-button" pill shape="solid" color="norm" onClick={props.onClose}>
                {c('Action').t`Got it`}
            </Button>,
        ]}
    >
        <div className="flex flex-column items-center w-full gap-4 m-auto">
            <img src={onboardingSVG} className="w-3/5" alt="" />
            <h4 className="text-bold">{c('Title').t`Not included in your plan`}</h4>
            <p className="m-2 text-md">
                {c('Info').t`This feature is not supported in your plan. Contact your admin to gain access.`}
            </p>
        </div>
    </AdaptiveModal>
);
