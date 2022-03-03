import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { APPS, SHOW_IMAGES } from '@proton/shared/lib/constants';

import { Info, Button, useModalState, SettingsLink } from '../../components';
import { useFeature, useMailSettings, useUser } from '../../hooks';
import EmbeddedToggle from './EmbeddedToggle';
import ShowMovedToggle from './ShowMovedToggle';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import DelaySendSecondsSelect from './DelaySendSecondsSelect';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { FeatureCode } from '../features';
import { RemoteToggle } from '../emailPrivacy';
import ShortcutsToggle from '../general/ShortcutsToggle';
import { MailShortcutsModal } from '../mail';
import {
    DailyEmailNotificationToggleInput,
    DailyEmailNotificationToggleLabel,
} from '../recovery/DailyEmailNotificationToggle';

const { EMBEDDED } = SHOW_IMAGES;

const MessagesSection = () => {
    const [{ ShowImages = EMBEDDED, ConfirmLink = 1, DelaySendSeconds = 10, Shortcuts = 0 } = {}] = useMailSettings();
    const [, setShortcuts] = useState(Shortcuts);
    const [user, userLoading] = useUser();
    const [showImages, setShowImages] = useState(ShowImages);
    const handleChange = (newValue: number) => setShowImages(newValue);
    const { feature: spyTrackerFeature } = useFeature(FeatureCode.SpyTrackerProtection);

    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    const handleChangeShowImage = (newValue: number) => setShowImages(newValue);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShortcuts(Shortcuts);
    }, [Shortcuts]);

    const showDailyEmailNotificationSection = !userLoading && !user.isSubUser && user.isPrivate;

    return (
        <>
            {!spyTrackerFeature?.Value && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="remoteToggle" className="text-semibold">
                            <span className="mr0-5">{c('Label').t`Ask before loading remote content`}</span>
                            <Info
                                url="https://protonmail.com/support/knowledge-base/images-by-default/"
                                title={c('Info')
                                    .t`Prevents content from the sender's server from loading without your permission.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        <RemoteToggle id="remoteToggle" showImages={showImages} onChange={handleChangeShowImage} />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
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
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="text-semibold">
                        {c('Title').t`Enable keyboard shortcuts`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-align-items-center">
                    <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                    <Button
                        shape="outline"
                        onClick={() => setMailShortcutsModalOpen(true)}
                        className="flex-item-noshrink flex-item-nogrow"
                    >
                        {c('Action').t`Show shortcuts`}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>
            {showDailyEmailNotificationSection && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <DailyEmailNotificationToggleLabel />
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        <DailyEmailNotificationToggleInput />
                        <SettingsLink className="ml0-5" path="/recovery" app={APPS.PROTONMAIL}>{c('Link')
                            .t`Set email address`}</SettingsLink>
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};

export default MessagesSection;
