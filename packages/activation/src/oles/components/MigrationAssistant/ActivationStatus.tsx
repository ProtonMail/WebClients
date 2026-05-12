import type { FC } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

const NotActivated: FC<{ showTooltip: boolean }> = ({ showTooltip }) =>
    ((children) =>
        showTooltip ? (
            <Tooltip
                openDelay={0}
                title={c('BOSS').t`User needs to activate their account through the activation link shown above`}
            >
                {children}
            </Tooltip>
        ) : (
            children
        ))(<span className="color-hint">{c('BOSS').t`Not activated`}</span>);

const Activated = () => (
    <>
        <IcCheckmarkCircleFilled className="color-success" />
        <span>{c('BOSS').t`Activated`}</span>
    </>
);

const ActivationStatus: FC<{
    isActivated: boolean;
    activationLinkVisible: boolean;
}> = ({ isActivated, activationLinkVisible }) => {
    return (
        <div className="flex items-center gap-1 justify-end justify-start-when-stacked">
            {isActivated ? <Activated /> : <NotActivated showTooltip={activationLinkVisible} />}
        </div>
    );
};

export default ActivationStatus;
