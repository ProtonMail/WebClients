import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateSpamAction, updateStickyLabels, updateViewMode } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS, STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import StickyLabelsToggle from '../layouts/StickyLabelsToggle';
import ViewModeToggle from '../layouts/ViewModeToggle';
import AlmostAllMailToggle from './AlmostAllMailToggle';
import AutoDeleteSetting from './AutoDeleteSetting';
import EmbeddedToggle from './EmbeddedToggle';
import { PageSizeSelector } from './PageSizeSelector';
import RequestLinkConfirmationToggle from './RequestLinkConfirmationToggle';
import ShowMovedToggle from './ShowMovedToggle';
import SpamActionSelect from './SpamActionSelect';

const MessagesSection = () => {
    const [
        {
            ViewMode,
            StickyLabels,
            ConfirmLink,
            SpamAction,
            AutoDeleteSpamAndTrashDays,
            AlmostAllMail,
        } = DEFAULT_MAILSETTINGS,
    ] = useMailSettings();
    const { createNotification } = useNotifications();
    const isAlmostAllMailEnabled = !!useFeature(FeatureCode.AlmostAllMail).feature?.Value;
    const dispatch = useDispatch();
    const api = useApi();

    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingStickyLabels, withLoadingStickyLabels] = useLoading();
    const [loadingSpamAction, withLoadingSpamAction] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleToggleStickyLabels = async (value: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateStickyLabels(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeViewMode = async (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            await api(updateStickyLabels(STICKY_LABELS.DISABLED));
        }
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateViewMode(mode));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeSpamAction = async (spamAction: SPAM_ACTION | null) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateSpamAction(spamAction));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
                <SettingsLayoutRight isToggleContainer>
                    <EmbeddedToggle id="embeddedToggle" />
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
                <SettingsLayoutRight isToggleContainer>
                    <ShowMovedToggle id="showMovedToggle" />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                {isAlmostAllMailEnabled && (
                    <>
                        <SettingsLayoutLeft>
                            <label htmlFor="almostAllMail" className="text-semibold">
                                <span className="mr-2">{c('Label').t`Exclude Spam/Trash from All mail`}</span>
                                <Info title={c('Info').t`Not yet available in our Android mobile app.`} />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight isToggleContainer>
                            <AlmostAllMailToggle id="almostAllMail" showAlmostAllMail={AlmostAllMail} />
                        </SettingsLayoutRight>
                    </>
                )}
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
                <SettingsLayoutRight isToggleContainer>
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

                <SettingsLayoutRight isToggleContainer>
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
                <SettingsLayoutRight isToggleContainer>
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
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="pageSizeSelector" className="text-semibold" id="label-pageSizeSelector">
                        <span className="mr-2">
                            {ViewMode === VIEW_MODE.GROUP
                                ? c('Label').t`Conversations per page`
                                : c('Label').t`Messages per page`}
                        </span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <PageSizeSelector id="pageSizeSelector" />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default MessagesSection;
