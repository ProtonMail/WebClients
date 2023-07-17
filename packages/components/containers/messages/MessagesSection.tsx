import { useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateSpamAction, updateStickyLabels, updateViewMode } from '@proton/shared/lib/api/mailSettings';
import { SHOW_IMAGES, STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SpamAction } from '@proton/shared/lib/interfaces';

import { Info } from '../../components';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import StickyLabelsToggle from '../layouts/StickyLabelsToggle';
import ViewModeToggle from '../layouts/ViewModeToggle';
import AutoDeleteSetting from './AutoDeleteSetting';
import EmbeddedToggle from './EmbeddedToggle';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import ShowMovedToggle from './ShowMovedToggle';
import SpamActionSelect from './SpamActionSelect';

const MessagesSection = () => {
    const [
        {
            ViewMode = 0,
            StickyLabels = 0,
            HideEmbeddedImages = SHOW_IMAGES.SHOW,
            ConfirmLink = 1,
            SpamAction = null,
            AutoDeleteSpamAndTrashDays = 0,
        } = {},
    ] = useMailSettings();
    const [hideEmbeddedImages, setHideEmbeddedImages] = useState(HideEmbeddedImages);
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();

    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingStickyLabels, withLoadingStickyLabels] = useLoading();
    const [loadingSpamAction, withLoadingSpamAction] = useLoading();

    const handleChangeHideEmbedded = (newValue: number) => setHideEmbeddedImages(newValue);

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
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="embeddedToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Auto show embedded images`}</span>
                        <Info
                            url={getKnowledgeBaseUrl('/images-by-default')}
                            title={c('Info')
                                .t`When disabled, this prevents image files from loading on your device without your knowledge.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2">
                    <EmbeddedToggle
                        id="embeddedToggle"
                        hideEmbeddedImages={hideEmbeddedImages}
                        onChange={handleChangeHideEmbedded}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="showMovedToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Keep messages in Sent/Drafts`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Messages in the Sent or Drafts folder will continue to appear in that folder, even if you move them to another folder.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2">
                    <ShowMovedToggle id="showMovedToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="requestLinkConfirmationToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Confirm link URLs`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you click on a link, this anti-phishing feature will ask you to confirm the URL of the web page.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2">
                    <RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="viewMode" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Conversation grouping`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                        />
                    </label>
                </SettingsLayoutLeft>

                <SettingsLayoutRight className="pt-2">
                    <ViewModeToggle
                        id="viewMode"
                        viewMode={ViewMode}
                        loading={loadingViewMode}
                        onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
                        data-testid="appearance:conversation-group-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <AutoDeleteSetting settingValue={AutoDeleteSpamAndTrashDays} onSaved={notifyPreferenceSaved} />

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="stickyLabelsToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Sticky labels`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you add a label to a message in a conversation, it will automatically be applied to all future messages you send or receive in that conversation.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt-2">
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
                        <span className="mr-2">{c('Label').t`Auto-unsubscribe`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you move an email to spam, you’ll automatically be unsubscribed from the sender’s mailing lists.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
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
