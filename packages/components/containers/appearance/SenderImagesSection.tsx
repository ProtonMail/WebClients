import { c } from 'ttag';

import { Info } from '../../components';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../account';
import SenderImagesToggle from './SenderImagesToggle';

const SenderImagesSection = () => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="senderImagesToggle" className="flex-item-fluid">
                    <span className="mr0-5">{c('Label').t`Show sender images`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Show each sender's image in the message list. Then sender's initial will be shown if a photo is not available.`}
                    />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight className="flex flex-item-fluid flex-align-items-center">
                <SenderImagesToggle className="mr1" id="senderImagesToggle" />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default SenderImagesSection;
