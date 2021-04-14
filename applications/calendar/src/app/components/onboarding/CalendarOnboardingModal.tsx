import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import {
    AppLink,
    ButtonLike,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import onboardingWelcome from 'design-system/assets/img/onboarding/calendar-welcome.svg';
import { CALENDAR_APP_NAME } from 'proton-shared/lib/calendar/constants';

const CalendarOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONCALENDAR);

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => {
                const importEventsButton = (
                    <ButtonLike
                        as={AppLink}
                        to="/calendar/calendars#import"
                        toApp={APPS.PROTONACCOUNT}
                        target="_self"
                        onClick={onClose}
                    >
                        {c(`Onboarding ProtonCalendar`).t`Import your events`}
                    </ButtonLike>
                );
                return (
                    <OnboardingStep
                        title={c(`Onboarding ProtonCalendar`).t`Your secure calendar is ready`}
                        submit={c(`Onboarding ProtonCalendar`).t`Start using ${appName}`}
                        onSubmit={onClose}
                        close={importEventsButton}
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
