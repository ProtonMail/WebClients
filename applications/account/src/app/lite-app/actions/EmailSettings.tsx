import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import ViewModeToggle from '@proton/mail-settings/layouts/ViewModeToggle';
import AlmostAllMailToggle from '@proton/mail-settings/messages/AlmostAllMailToggle';
import AutoDeleteSpamAndTrashDaysToggle from '@proton/mail-settings/messages/AutoDeleteSpamAndTrashDaysToggle';
import DelaySendSecondsSelect from '@proton/mail-settings/messages/DelaySendSecondsSelect';
import NextMessageOnMoveToggle from '@proton/mail-settings/messages/NextMessageOnMoveToggle';
import ShowMovedToggle from '@proton/mail-settings/messages/ShowMovedToggle';
import SwipeActionSelect from '@proton/mail-settings/messages/SwipeActionSelect';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { SWIPE_ACTION } from '@proton/shared/lib/mail/mailSettings';
import { STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { CategoriesSettings } from '../components/CategoryView/CategoriesSettings';
import { CategoriesToggle } from '../components/CategoryView/CategoriesToggle';
import MobileSection from '../components/MobileSection';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

import './MobileSettings.scss';

const EmailSettings = ({
    layout,
    loader,
}: {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    loader: React.ReactNode;
}) => {
    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [, foldersLoading] = useFolders();
    const loading = loadingMailSettings || loadingUser || foldersLoading || '_isDefault' in mailSettings;

    const { update, isLoading } = useUpdateMailSetting();

    const handleChangeViewMode = (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            update('StickyLabels', STICKY_LABELS.DISABLED, { notify: false });
        }
        update('ViewMode', mode);
    };

    if (loading) {
        return loader;
    }

    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Label').t`Email categories`}>
                <CategoriesToggle />
                <CategoriesSettings />
            </MobileSection>

            <MobileSection title={c('Label').t`Mailbox settings`}>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="telemetry"
                        description={c('Info')
                            .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                    >
                        {c('Label').t`Conversation grouping`}
                    </MobileSectionLabel>
                    <ViewModeToggle
                        id="viewMode"
                        viewMode={mailSettings.ViewMode}
                        loading={isLoading('ViewMode') || isLoading('StickyLabels')}
                        onToggle={handleChangeViewMode}
                        data-testid="appearance:conversation-group-toggle"
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="delaySendSecondsSelect"
                        description={c('Info')
                            .t`This feature delays sending your emails, giving you the opportunity to undo send during the selected time frame.`}
                    >{c('Label').t`Undo send`}</MobileSectionLabel>
                    <div>
                        <DelaySendSecondsSelect
                            id="delaySendSecondsSelect"
                            delaySendSeconds={mailSettings.DelaySendSeconds}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="auto-advance"
                        description={c('Info')
                            .t`Automatically show the next email when an open email is deleted, archived or moved.`}
                    >{c('Label').t`Auto-advance`}</MobileSectionLabel>
                    <NextMessageOnMoveToggle
                        id="auto-advance"
                        loading={isLoading('NextMessageOnMove')}
                        nextMessageOnMove={mailSettings.NextMessageOnMove}
                        onToggle={(value) => update('NextMessageOnMove', value)}
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="swipeLeftAction">{c('Label').t`Swipe left action`}</MobileSectionLabel>
                    <div>
                        <SwipeActionSelect
                            id="swipeLeftAction"
                            value={mailSettings.SwipeLeft}
                            onChange={(swipeAction: SWIPE_ACTION) => update('SwipeLeft', swipeAction)}
                            loading={isLoading('SwipeLeft')}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="swipeRightAction">{c('Label')
                        .t`Swipe right action`}</MobileSectionLabel>
                    <div>
                        <SwipeActionSelect
                            id="swipeRightAction"
                            value={mailSettings.SwipeRight}
                            onChange={(swipeAction: SWIPE_ACTION) => update('SwipeRight', swipeAction)}
                            loading={isLoading('SwipeRight')}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="showMovedToggle"
                        description={c('Info')
                            .t`Messages in the Sent or Drafts folder will continue to appear in that folder, even if you move them to another folder.`}
                    >
                        {c('Label').t`Keep emails in Sent/Drafts`}
                    </MobileSectionLabel>
                    <ShowMovedToggle id="showMovedToggle" />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="almostAllMail"
                        description={c('Info')
                            .t`Messages in the Spam or Trash folder will be excluded from the All mail location.`}
                    >{c('Label').t`Exclude Spam/Trash from All mail`}</MobileSectionLabel>
                    <AlmostAllMailToggle id="almostAllMail" showAlmostAllMail={mailSettings.AlmostAllMail} />
                </MobileSectionRow>
                {user.hasPaidMail ? (
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="autoDelete"
                            description={c('Info')
                                .t`Delete trash and spam messages after 30 days. Turning on auto-delete gives messages already in trash/spam a deletion date based on the date they were moved there.`}
                        >{c('Label').t`Auto-delete trash and spam`}</MobileSectionLabel>
                        <AutoDeleteSpamAndTrashDaysToggle
                            id="autoDelete"
                            loading={isLoading('AutoDeleteSpamAndTrashDays')}
                            autoDeleteSpamAndTrashDays={mailSettings.AutoDeleteSpamAndTrashDays}
                            onToggle={(newValue) => update('AutoDeleteSpamAndTrashDays', newValue)}
                        />
                    </MobileSectionRow>
                ) : null}
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default EmailSettings;
