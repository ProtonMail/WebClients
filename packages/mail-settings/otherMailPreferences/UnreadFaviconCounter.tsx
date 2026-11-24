import { c } from 'ttag';

import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';

import { UnreadFaviconCounterToggle } from './UnreadFaviconCounterToggle';

export const UnreadFaviconCounter = () => {
    return (
        <SettingsToggleRow
            id="unreadFaviconCounterToggle"
            label={
                <>
                    <SettingsToggleRow.Label>{c('Label').t`Show unread count in Favicon`}</SettingsToggleRow.Label>
                    <SettingsToggleRow.Description>
                        {c('Tooltip').t`See number of unread messages in the tab icon`}
                    </SettingsToggleRow.Description>
                </>
            }
            toggle={<UnreadFaviconCounterToggle id="unreadFaviconCounterToggle" />}
        />
    );
};
