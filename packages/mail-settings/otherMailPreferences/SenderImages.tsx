import { c } from 'ttag';

import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';

import SenderImagesToggle from './SenderImagesToggle';

export const SenderImages = () => {
    return (
        <SettingsToggleRow
            id="senderImagesToggle"
            label={
                <>
                    <SettingsToggleRow.Label>{c('Label').t`Show sender images`}</SettingsToggleRow.Label>
                    <SettingsToggleRow.Description>
                        {c('Tooltip')
                            .t`Show each sender's image in the message list. The sender's initials will be shown if a photo is not available.`}
                    </SettingsToggleRow.Description>
                </>
            }
            toggle={<SenderImagesToggle id="senderImagesToggle" />}
        />
    );
};
