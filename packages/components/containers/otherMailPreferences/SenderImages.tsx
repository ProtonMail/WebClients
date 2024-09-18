import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';

import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../account';
import SenderImagesToggle from './SenderImagesToggle';

export const SenderImages = () => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="senderImagesToggle">
                    <span className="text-semibold mr-2">{c('Label').t`Show sender images`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Show each sender's image in the message list. The sender's initials will be shown if a photo is not available.`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <SenderImagesToggle className="mr-4" id="senderImagesToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
