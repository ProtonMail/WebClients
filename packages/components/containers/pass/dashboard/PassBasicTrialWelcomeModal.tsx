import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getSubscriptionSearchParamsString } from '@proton/payments/core/subscription/search-params';
import { APPS } from '@proton/shared/lib/constants';

import SettingsLink from '../../../components/link/SettingsLink';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import Time from '../../../components/time/Time';

import './PassBasicTrialWelcomeModal.scss';

interface HighlightRowProps {
    tone: 'info' | 'success' | 'danger';
    icon: ReactNode;
    lead: ReactNode;
    text: ReactNode;
}

const HighlightRow = ({ tone, icon, lead, text }: HighlightRowProps) => (
    <div className="flex flex-nowrap items-center gap-4 w-full">
        <span
            className={`pass-basic-trial-modal-tile pass-basic-trial-modal-tile--${tone} shrink-0 rounded-lg flex items-center justify-center`}
        >
            {icon}
        </span>
        <p className="m-0 flex-1 text-rg">
            <span className="text-semibold">{lead} </span>
            <span className="color-weak">{text}</span>
        </p>
    </div>
);

interface Props extends ModalStateProps {
    trialEndDate: number;
}

const PassBasicTrialWelcomeModal = ({ trialEndDate, ...modalProps }: Props) => {
    const trialPlanName = PLAN_NAMES[PLANS.PASS_BUSINESS];
    const freePlanName = PLAN_NAMES[PLANS.PASS_BASIC];
    const formattedDate = (
        <Time format="PPP" key="trial-end-date">
            {trialEndDate}
        </Time>
    );

    const optOutPath = `/dashboard?${getSubscriptionSearchParamsString({
        plan: PLANS.PASS_BASIC,
        cycle: CYCLE.MONTHLY,
        target: 'checkout',
        fixedPlan: true,
        fixedCycle: true,
    })}`;

    return (
        <ModalTwo {...modalProps} enableCloseWhenClickOutside>
            <ModalTwoContent unstyled className="flex flex-column gap-12 pt-12 px-12 pb-6">
                <div className="text-center">
                    <p className="m-0 mb-2 text-rg text-bold color-primary text-uppercase">
                        {c('Info').t`Welcome offer`}
                    </p>
                    <h1 className="text-2xl text-bold m-0">
                        {c('Title').jt`Get ${trialPlanName} for free until ${formattedDate}.`}
                    </h1>
                </div>
                <div className="flex flex-column gap-4">
                    <HighlightRow
                        tone="info"
                        icon={<IcHourglass size={9} />}
                        lead={c('Info').jt`Try everything free until ${formattedDate}.`}
                        text={c('Info')
                            .t`Explore unlimited aliases, team vaults, SSO, and admin policies - no commitment.`}
                    />
                    <HighlightRow
                        tone="success"
                        icon={<IcClock size={9} />}
                        lead={c('Info').t`Nothing happens automatically.`}
                        text={c('Info')
                            .t`Your trial won't roll into a paid plan without explicit consent. We'll remind you before it ends.`}
                    />
                    <HighlightRow
                        tone="danger"
                        icon={<IcLifeRing size={9} />}
                        lead={c('Info').t`Changed your mind?`}
                        text={c('Info')
                            .t`Opt out at any time - you will return to the free ${freePlanName} tier. Any items beyond the free tier limits will remain visible but read-only.`}
                    />
                </div>
                <div className="flex flex-column gap-2">
                    <Button color="norm" size="large" fullWidth onClick={modalProps.onClose}>
                        {c('Action').t`Continue with trial - no payment required`}
                    </Button>
                    <ButtonLike
                        as={SettingsLink}
                        path={optOutPath}
                        app={APPS.PROTONPASS}
                        shape="underline"
                        color="norm"
                        fullWidth
                        onClick={modalProps.onClose}
                    >
                        {c('Action').t`No thanks, opt out of the trial`}
                    </ButtonLike>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default PassBasicTrialWelcomeModal;
