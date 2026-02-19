import type { ReactNode } from 'react';

import { useModalState } from '@proton/components';

import { useLumoSelector } from '../../../redux/hooks';
import { selectEligibilityStatusState } from '../../../redux/slices/meta/eligibilityStatus';
import { LUMO_ELIGIBILITY } from '../../../types';
import { LimitedLumoHeader } from '../../header/LimitedLumoHeader';
import { WaitlistModal } from '../WaitlistModal';
import { WaitlistSuccessView } from './WaitlistSuccessView';

interface Props {
    children: ReactNode;
}

// This is meant to be a temporary component to block non-eligible users while FF is enabled.
const EligibilityGuard = ({ children }: Props) => {
    const { eligibility, recentlyJoined } = useLumoSelector(selectEligibilityStatusState);
    const [inviteModalProps] = useModalState();


    switch (eligibility) {
        case LUMO_ELIGIBILITY.Eligible: {
            return <>{children}</>;
        }
        case LUMO_ELIGIBILITY.NotOnWaitlist: {
            return (
                <div className="flex flex-column flex-nowrap h-full flex-1 reset4print">
                    <LimitedLumoHeader />
                    <WaitlistModal {...inviteModalProps} open />
                </div>
            );
        }

        case LUMO_ELIGIBILITY.OnWaitlist: {
            return (
                <div className="flex flex-column flex-nowrap h-full flex-1 reset4print">
                    <LimitedLumoHeader />
                    <WaitlistSuccessView recentlyJoined={recentlyJoined} />
                </div>
            );
        }

        default:
            return <>{children}</>;
    }
};

export default EligibilityGuard;
