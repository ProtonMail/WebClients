import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import type { ResetOrganizationKeyStep, ResetOrganizationKeyStepStatus } from '@proton/account';
import lockClock from '@proton/account/organizationKey/lock-clock.svg';
import { Card } from '@proton/atoms/Card/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import clsx from '@proton/utils/clsx';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import { getEstimatedResetMinutes } from './helper';

export type ResetProgress = Record<ResetOrganizationKeyStep, ResetOrganizationKeyStepStatus>;

export const initialResetProgress: ResetProgress = {
    privatize: 'pending',
    rotate: 'pending',
    unprivatize: 'pending',
};

const StepIcon = ({ status }: { status: ResetOrganizationKeyStepStatus }) => {
    if (status === 'done') {
        return <IcCheckmarkCircleFilled className="color-success shrink-0" />;
    }
    if (status === 'running') {
        return <CircleLoader className="color-primary shrink-0" />;
    }
    return <span className="shrink-0 rounded-50 border border-weak w-4 h-4" />;
};

const StepRow = ({ status, children }: { status: ResetOrganizationKeyStepStatus; children: ReactNode }) => {
    return (
        <li className="flex flex-nowrap items-center gap-3">
            <StepIcon status={status} />
            <span className={clsx(status === 'pending' && 'color-weak')}>{children}</span>
        </li>
    );
};

/**
 * Runs while the reset is in progress. It has no close button on purpose: interrupting the job leaves members
 * converted to private until the flow is resumed.
 */
const ResettingStep = ({ progress, affectedMemberCount }: { progress: ResetProgress; affectedMemberCount: number }) => {
    const minutes = getEstimatedResetMinutes(affectedMemberCount);

    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Resetting organization key`} hasClose={false} />
            <ModalTwoContent>
                <Card rounded className="flex flex-nowrap items-start gap-3">
                    <img src={lockClock} alt="" className="shrink-0" />
                    <div>
                        {getBoldFormattedText(
                            c('organization key reset').ngettext(
                                msgid`This should take less than ${minutes} minute. **Don't close this tab or let your device go to sleep** until it's finished.`,
                                `This should take less than ${minutes} minutes. **Don't close this tab or let your device go to sleep** until it's finished.`,
                                minutes
                            )
                        )}
                    </div>
                </Card>
                <ul className="unstyled mt-4 mb-0 flex flex-column gap-3">
                    <StepRow status={progress.privatize}>
                        {c('organization key reset').t`Converting users to private`}
                    </StepRow>
                    <StepRow status={progress.rotate}>
                        {c('organization key reset').t`Resetting organization key`}
                    </StepRow>
                    <StepRow status={progress.unprivatize}>
                        {c('organization key reset').t`Send unprivatization requests`}
                    </StepRow>
                </ul>
            </ModalTwoContent>
        </>
    );
};

export default ResettingStep;
