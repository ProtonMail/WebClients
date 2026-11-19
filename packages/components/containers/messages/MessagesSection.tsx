import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateSpamAction, updateStickyLabels, updateViewMode } from '@proton/shared/lib/api/mailSettings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';
import { STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { SettingsCardRows } from '../account/SettingsCardRows';
import { SettingsSelectRow } from '../account/SettingsSelectRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
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
    const [{ ViewMode, StickyLabels, ConfirmLink, SpamAction, AutoDeleteSpamAndTrashDays, AlmostAllMail }] =
        useMailSettings();
    const { createNotification } = useNotifications();
    const isAlmostAllMailEnabled = !!useFeature(FeatureCode.AlmostAllMail).feature?.Value;
    const isAutoDeleteEnabled = useFeature(FeatureCode.AutoDelete).feature?.Value === true;
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
        <SettingsCardRows>
            <SettingsToggleRow
                id="embeddedToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Auto show embedded images`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Info')
                                .t`When disabled, this prevents image files from loading on your device without your knowledge.`}{' '}
                            <Href href={getKnowledgeBaseUrl('/images-by-default')}>{c('Link').t`Learn more`}</Href>
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<EmbeddedToggle id="embeddedToggle" />}
            />
            <SettingsToggleRow
                id="showMovedToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Keep messages in Sent/Drafts`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip')
                                .t`Messages in the Sent or Drafts folder will continue to appear in that folder, even if you move them to another folder.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<ShowMovedToggle id="showMovedToggle" />}
            />
            {isAlmostAllMailEnabled && (
                <SettingsToggleRow
                    id="almostAllMail"
                    label={
                        <SettingsToggleRow.Label>{c('Label')
                            .t`Exclude Spam/Trash from All mail`}</SettingsToggleRow.Label>
                    }
                    toggle={<AlmostAllMailToggle id="almostAllMail" showAlmostAllMail={AlmostAllMail} />}
                />
            )}
            <SettingsToggleRow
                id="requestLinkConfirmationToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Confirm link URLs`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip')
                                .t`When you click on a link, this anti-phishing feature will ask you to confirm the URL of the web page.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />}
            />
            <SettingsToggleRow
                id="viewMode"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Conversation grouping`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip')
                                .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={
                    <ViewModeToggle
                        id="viewMode"
                        viewMode={ViewMode}
                        loading={loadingViewMode}
                        onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
                        data-testid="appearance:conversation-group-toggle"
                    />
                }
            />
            {isAutoDeleteEnabled && (
                <AutoDeleteSetting settingValue={AutoDeleteSpamAndTrashDays} onSaved={notifyPreferenceSaved} />
            )}
            <SettingsToggleRow
                id="stickyLabelsToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Sticky labels`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip')
                                .t`When you add a label to a message in a conversation, it will automatically be applied to all future messages you send or receive in that conversation.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={
                    <StickyLabelsToggle
                        id="stickyLabelsToggle"
                        stickyLabels={StickyLabels}
                        loading={loadingStickyLabels}
                        onToggle={(value) => withLoadingStickyLabels(handleToggleStickyLabels(value))}
                        data-testid="appearance:sticky-labels-toggle"
                        disabled={ViewMode !== VIEW_MODE.GROUP}
                    />
                }
            />
            <SettingsSelectRow
                id="spamActionLabelSelect"
                label={
                    <>
                        <SettingsSelectRow.Label>{c('Label').t`Auto-unsubscribe`}</SettingsSelectRow.Label>
                        <SettingsSelectRow.Description>
                            {c('Tooltip')
                                .t`When you move an email to spam, you’ll automatically be unsubscribed from the sender’s mailing lists.`}
                        </SettingsSelectRow.Description>
                    </>
                }
                select={
                    <SpamActionSelect
                        id="spamActionLabelSelect"
                        value={SpamAction}
                        onChange={(value) => withLoadingSpamAction(handleChangeSpamAction(value))}
                        loading={loadingSpamAction}
                    />
                }
            />
            <SettingsSelectRow
                id="pageSizeSelector"
                label={
                    <SettingsSelectRow.Label id="label-pageSizeSelector">
                        {ViewMode === VIEW_MODE.GROUP
                            ? c('Label').t`Conversations per page`
                            : c('Label').t`Messages per page`}
                    </SettingsSelectRow.Label>
                }
                select={
                    // The selector is narrower than the column: align it with the other controls
                    <div className="flex md:justify-end">
                        <PageSizeSelector id="pageSizeSelector" />
                    </div>
                }
            />
        </SettingsCardRows>
    );
};

export default MessagesSection;
