import React, { useState } from 'react';
import { c } from 'ttag';

import { SHOW_IMAGES } from 'proton-shared/lib/constants';

import { Info } from '../../components';
import { useMailSettings } from '../../hooks';

import RemoteToggle from './RemoteToggle';
import EmbeddedToggle from './EmbeddedToggle';
import ShowMovedToggle from './ShowMovedToggle';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import DelaySendSecondsSelect from './DelaySendSecondsSelect';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const { EMBEDDED } = SHOW_IMAGES;

const MessagesSection = () => {
    const [{ ShowImages = EMBEDDED, ConfirmLink = 1, DelaySendSeconds = 10 } = {}] = useMailSettings();
    const [showImages, setShowImages] = useState(ShowImages);
    const handleChange = (newValue: number) => setShowImages(newValue);

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="remoteToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Auto-load remote content`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/images-by-default/"
                            title={c('Info')
                                .t`When disabled, this prevents all files from loading on your device without your knowledge.	`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <RemoteToggle id="remoteToggle" showImages={showImages} onChange={handleChange} />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="embeddedToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Auto-load embedded images`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/images-by-default/"
                            title={c('Info')
                                .t`When disabled, this prevents image files from loading on your device without your knowledge.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <EmbeddedToggle id="embeddedToggle" showImages={showImages} onChange={handleChange} />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="showMovedToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Keep messages in Sent/Drafts`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Messages in the Sent or Drafts folder will continue to appear in that folder, even if you move them to another folder.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <ShowMovedToggle id="showMovedToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="requestLinkConfirmationToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Link confirmation`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you click on a link, this anti-phishing feature will ask you to confirm the URL of the web page.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="delaySendSecondsSelect" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Undo send`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`This feature delays sending your emails, giving you the opportunity to undo send during the selected time frame.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <DelaySendSecondsSelect id="delaySendSecondsSelect" delaySendSeconds={DelaySendSeconds} />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default MessagesSection;
