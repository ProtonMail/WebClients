import { useState } from 'react';
import { c } from 'ttag';

import { SHOW_IMAGES, STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/constants';
import { updateSpamAction, updateStickyLabels, updateViewMode } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SpamAction } from '@proton/shared/lib/interfaces';
import { Info } from '../../components';
import { useApi, useEventManager, useFeature, useLoading, useMailSettings, useNotifications } from '../../hooks';
import EmbeddedToggle from './EmbeddedToggle';
import ShowMovedToggle from './ShowMovedToggle';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { FeatureCode } from '../features';
import { RemoteToggle } from '../emailPrivacy';
import ViewModeToggle from '../layouts/ViewModeToggle';
import StickyLabelsToggle from '../layouts/StickyLabelsToggle';
import SpamActionSelect from './SpamActionSelect';

const { EMBEDDED } = SHOW_IMAGES;

const MessagesSection = () => {
    const [{ ViewMode = 0, StickyLabels = 0, ShowImages = EMBEDDED, ConfirmLink = 1, SpamAction = null, } = {}] = useMailSettings();
    const [showImages, setShowImages] = useState(ShowImages);
    const handleChange = (newValue: number) => setShowImages(newValue);
    const { feature: spyTrackerFeature } = useFeature(FeatureCode.SpyTrackerProtection);
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();

    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingStickyLabels, withLoadingStickyLabels] = useLoading();
    const [loadingSpamAction, withLoadingSpamAction] = useLoading();

    const handleChangeShowImage = (newValue: number) => setShowImages(newValue);

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleToggleStickyLabels = async (value: number) => {
        await api(updateStickyLabels(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeViewMode = async (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            await api(updateStickyLabels(STICKY_LABELS.OFF));
        }
        await api(updateViewMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeSpamAction = async (spamAction: SpamAction | null) => {
        await api(updateSpamAction(spamAction));
        await call();
        notifyPreferenceSaved();
    };

    return (
        <>
            {!spyTrackerFeature?.Value && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="remoteToggle" className="text-semibold">
                            <span className="mr0-5">{c('Label').t`Ask before loading remote content`}</span>
                            <Info
                                url={getKnowledgeBaseUrl('/images-by-default')}
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
                            url={getKnowledgeBaseUrl('/images-by-default')}
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
                        <span className="mr0-5">{c('Label').t`Confirm link URLs`}</span>
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
                    <label htmlFor="viewMode" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Conversation grouping`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                        />
                    </label>
                </SettingsLayoutLeft>

                <SettingsLayoutRight className="pt0-5">
                    <ViewModeToggle
                        id="viewMode"
                        viewMode={ViewMode}
                        loading={loadingViewMode}
                        onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
                        data-testid="appearance:conversation-group-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="stickyLabelsToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Sticky labels`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you add a label to a message in a conversation, it will automatically be applied to all future messages you send or receive in that conversation.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <StickyLabelsToggle
                        id="stickyLabelsToggle"
                        stickyLabels={StickyLabels}
                        loading={loadingStickyLabels}
                        onToggle={(value) => withLoadingStickyLabels(handleToggleStickyLabels(value))}
                        data-testid="appearance:sticky-labels-toggle"
                        disabled={ViewMode !== VIEW_MODE.GROUP}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="spamActionLabelSelect" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Spam filtering`}</span>
                        <Info title={c('Tooltip').t`TODO`} />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <SpamActionSelect
                        id="spamActionLabelSelect"
                        value={SpamAction}
                        onChange={(value) => withLoadingSpamAction(handleChangeSpamAction(value))}
                        loading={loadingSpamAction}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default MessagesSection;
