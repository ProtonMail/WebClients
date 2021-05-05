import React from 'react';
import { c } from 'ttag';
import {
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
    useSettingsLink,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { CALENDAR_APP_NAME } from 'proton-shared/lib/calendar/constants';
import onboardingWelcome from 'design-system/assets/img/onboarding/calendar-welcome.svg';

const CalendarOnboardingModal = (props: any) => {
    const goToSettings = useSettingsLink();
    const appName = CALENDAR_APP_NAME;

    return (
        <OnboardingModal {...props}>
            {({ onNext }: OnboardingStepRenderCallback) => {
                return (
                    <OnboardingStep
                        submit={c(`Onboarding ProtonCalendar`).t`Import events`}
                        onSubmit={() => {
                            goToSettings('/calendars#import', APPS.PROTONCALENDAR, true);
                            onNext?.();
                        }}
                        close={c(`Onboarding ProtonCalendar`).t`Start using ${appName}`}
                        onClose={onNext}
                    >
                        <OnboardingContent
                            title={c(`Onboarding ProtonCalendar`).t`Meet your new encrypted calendar`}
                            description={c(`Onboarding ProtonCalendar`)
                                .t`A calendar is a record of your life. Keep your life secure and private with ${appName}.`}
                            img={<img src={onboardingWelcome} alt={appName} />}
                        />
                    </OnboardingStep>
                );
            }}
        </OnboardingModal>
    );
};

export default CalendarOnboardingModal;
