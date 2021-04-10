import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { useHistory } from 'react-router-dom';

import onboardingWelcome from 'design-system/assets/img/onboarding/calendar-welcome.svg';
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
                        title={c(`Onboarding ProtonCalendar`).t`Your secure calendar is ready`}
                        submit={c(`Onboarding ProtonCalendar`).t`Start using ${appName}`}
                        onSubmit={onClose}
                        close={c(`Onboarding ProtonCalendar`).t`Import your events`}
                        onClose={handleClose}
                    >
                        <OnboardingContent
                            description={c(`Onboarding ProtonCalendar`)
                                .t`${CALENDAR_APP_NAME} keeps your plans secure with end-to-end encryption, so we can’t see what you’re doing.`}
                            img={<img src={onboardingWelcome} alt={appName} />}
                            text={c(`Onboarding ProtonCalendar`)
                                .t`We recommend importing your events from your existing calendar. Our import tool is quick and easy, and works with any other provider.`}
                        />
                    </OnboardingStep>
                );
            }}
        </OnboardingModal>
    );
};

export default CalendarOnboardingModal;
