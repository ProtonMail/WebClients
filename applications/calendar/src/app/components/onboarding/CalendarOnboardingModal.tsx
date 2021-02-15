import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { useHistory } from 'react-router-dom';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protoncalendar.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protoncalendar-dark.svg';
import { CALENDAR_APP_NAME } from '../../constants';

const CalendarOnboardingModal = (props: any) => {
    const history = useHistory();
    const appName = getAppName(APPS.PROTONCALENDAR);

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => {
                const handleClose = () => {
                    history.push('/settings/calendars#import');
                    onClose?.();
                };
                return (
                    <OnboardingStep
                        title={c(`Onboarding Proton Calendar`).t`Your secure calendar is ready`}
                        submit={c(`Onboarding Proton Calendar`).t`Start using ${appName}`}
                        onSubmit={onClose}
                        close={c(`Onboarding Proton Calendar`).t`Import your events`}
                        onClose={handleClose}
                    >
                        <OnboardingContent
                            description={c(`Onboarding Proton Calendar`)
                                .t`${CALENDAR_APP_NAME} keeps your plans secure with end-to-end encryption, so we can’t see what you’re doing.`}
                            img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                            text={c(`Onboarding Proton Calendar`)
                                .t`We recommend importing your events from your existing calendar. Our import tool is quick and easy, and works with any other provider.`}
                        />
                    </OnboardingStep>
                );
            }}
        </OnboardingModal>
    );
};

export default CalendarOnboardingModal;
