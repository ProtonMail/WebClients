import React from 'react';
import { EarlyAccessSection, PrivateMainSettingsArea, SettingsPropsShared, useEarlyAccess } from 'react-components';
import { c } from 'ttag';
import { CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';

export const getGeneralSettingsPage = ({ hasEarlyAccess }: { hasEarlyAccess: boolean }) => {
    return {
        to: '/settings/general',
        icon: 'settings-master',
        text: c('Link').t`General`,
        subsections: [
            {
                text: c('Title').t`Time zone`,
                id: 'time',
            },
            {
                text: c('Title').t`Layout`,
                id: 'layout',
            },
            hasEarlyAccess
                ? {
                      text: c('Title').t`Early Access`,
                      id: 'early-access',
                  }
                : undefined,
        ].filter(isTruthy),
    };
};

interface Props extends SettingsPropsShared {
    calendarUserSettings: CalendarUserSettings;
}

const SettingsGeneralPage = ({ setActiveSection, calendarUserSettings, location }: Props) => {
    const { hasEarlyAccess } = useEarlyAccess();

    const { text, subsections } = getGeneralSettingsPage({ hasEarlyAccess });
    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            setActiveSection={setActiveSection}
            subsections={subsections}
        >
            <TimeSection calendarUserSettings={calendarUserSettings} />
            <LayoutSection calendarUserSettings={calendarUserSettings} />
            {hasEarlyAccess ? <EarlyAccessSection /> : null}
        </PrivateMainSettingsArea>
    );
};

export default SettingsGeneralPage;
