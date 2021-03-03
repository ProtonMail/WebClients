import React from 'react';
import { c } from 'ttag';
import { MessagesSection, ShortcutsSection, SettingsPropsShared } from 'react-components';

import PrivateMainSettingsAreaWithPermissions from '../../components/settings/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        to: '/settings/general',
        icon: 'general',
        subsections: [
            {
                text: c('Title').t`Messages`,
                id: 'messages',
            },
            {
                text: c('Title').t`Keyboard shortcuts`,
                id: 'shortcuts',
            },
        ],
    };
};

interface Props extends SettingsPropsShared {
    onOpenShortcutsModal: () => void;
}

const GeneralContainer = ({ setActiveSection, location, onOpenShortcutsModal }: Props) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getGeneralPage()}
            setActiveSection={setActiveSection}
        >
            <MessagesSection />
            <ShortcutsSection onOpenShortcutsModal={onOpenShortcutsModal} />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
