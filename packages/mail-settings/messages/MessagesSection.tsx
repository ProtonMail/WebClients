import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';
import { STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

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
    const isAlmostAllMailEnabled = !!useFeature(FeatureCode.AlmostAllMail).feature?.Value;
    const isAutoDeleteEnabled = useFeature(FeatureCode.AutoDelete).feature?.Value === true;
    const { update, isLoading } = useUpdateMailSetting();

    const handleToggleStickyLabels = (value: number) => {
        update('StickyLabels', value);
    };

    const handleChangeViewMode = (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            update('StickyLabels', STICKY_LABELS.DISABLED, { notify: false });
        }
        update('ViewMode', mode);
    };

    const handleChangeSpamAction = (spamAction: SPAM_ACTION | null) => {
        update('SpamAction', spamAction);
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
                        loading={isLoading('ViewMode')}
                        onToggle={(value) => handleChangeViewMode(value)}
                        data-testid="appearance:conversation-group-toggle"
                    />
                }
            />
            {isAutoDeleteEnabled && <AutoDeleteSetting settingValue={AutoDeleteSpamAndTrashDays} />}
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
                        loading={isLoading('StickyLabels')}
                        onToggle={(value) => handleToggleStickyLabels(value)}
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
                        onChange={(value) => handleChangeSpamAction(value)}
                        loading={isLoading('SpamAction')}
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
