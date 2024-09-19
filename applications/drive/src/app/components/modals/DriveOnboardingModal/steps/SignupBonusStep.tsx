import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingStep } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import accountSetupSvg from '@proton/styles/assets/img/illustrations/account-setup.svg';

import type { StepProps } from './interface';

type Props = {
    expiresInDays: number;
    hasNextStep: boolean;
};

export const SignupBonusStep = ({ onNext, hasNextStep, expiresInDays }: StepProps<Props>) => {
    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Title').t`Your welcome bonus`}
                description={c('Onboarding Info')
                    .t`Get started using ${DRIVE_APP_NAME} and we'll upgrade your storage to 5 GB!`}
                img={<img src={accountSetupSvg} alt={DRIVE_APP_NAME} />}
            />
            <div>
                {c('Onboarding Info').ngettext(
                    msgid`Simply complete the following in the next ${expiresInDays} day:`,
                    `Simply complete the following in the next ${expiresInDays} days:`,
                    expiresInDays
                )}
                <ul className="unstyled mt-4">
                    <li className="my-2 flex flex-nowrap">
                        <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />
                        <span className="flex-1">{c('Onboarding Info').t`Upload a file`}</span>
                    </li>
                    <li className="my-2 flex flex-nowrap">
                        <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />{' '}
                        <span className="flex-1">{c('Onboarding Info').t`Share a file`}</span>
                    </li>
                    <li className="my-2 flex flex-nowrap">
                        <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />{' '}
                        <span className="flex-1">{c('Onboarding Info').t`Set a recovery method`}</span>
                    </li>
                </ul>
            </div>
            <footer>
                <Button size="large" color="norm" fullWidth onClick={onNext}>
                    {hasNextStep
                        ? c('Onboarding Action').t`Next`
                        : c('Onboarding Action').t`Start using ${DRIVE_APP_NAME}`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};
