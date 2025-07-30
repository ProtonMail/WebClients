import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    AlmostAllMailToggle,
    AutoDeleteSpamAndTrashDaysToggle,
    DelaySendSecondsSelect,
    NextMessageOnMoveToggle,
    ShowMovedToggle,
    SwipeActionSelect,
    useApi,
    useNotifications,
} from '@proton/components';
import ViewModeToggle from '@proton/components/containers/layouts/ViewModeToggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import {
    updateAutoDelete,
    updateNextMessageOnMove,
    updateStickyLabels,
    updateSwipeLeft,
    updateSwipeRight,
    updateViewMode,
} from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { STICKY_LABELS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import type {
    AUTO_DELETE_SPAM_AND_TRASH_DAYS,
    NEXT_MESSAGE_ON_MOVE,
    SWIPE_ACTION,
} from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useAccountDispatch } from '../../app/store/hooks';
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
    const api = useApi();
    const dispatch = useAccountDispatch();

    const [loadingAutoDeleteSpamAndTrashDays, withLoadingAutoDeleteSpamAndTrashDays] = useLoading();
    const [loadingSwipeLeft, withLoadingSwipeLeft] = useLoading();
    const [loadingSwipeRight, withLoadingSwipeRight] = useLoading();
    const [loadingNextMessageOnMoveToggle, withLoadingNextMessageOnMoveToggle] = useLoading();
    const [loadingViewMode, withLoadingViewMode] = useLoading();

    const [user, loadingUser] = useUser();
    const [mailSettings = DEFAULT_MAILSETTINGS, loadingMailSettings] = useMailSettings();
    const {
        AutoDeleteSpamAndTrashDays,
        AlmostAllMail,
        DelaySendSeconds,
        SwipeLeft,
        SwipeRight,
        NextMessageOnMove,
        ViewMode,
    } = mailSettings;
    const loading = loadingMailSettings || loadingUser;

    const { createNotification } = useNotifications();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeSwipeLeft = async (swipeAction: SWIPE_ACTION) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateSwipeLeft(swipeAction));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeSwipeRight = async (swipeAction: SWIPE_ACTION) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateSwipeRight(swipeAction));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeNextMessageOnMove = async (nextMessageOnMove: NEXT_MESSAGE_ON_MOVE) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateNextMessageOnMove(nextMessageOnMove));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleAutoDeleteSpamAndTrashDays = async (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateAutoDelete(autoDelete));
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

    if (loading) {
        return loader;
    }

    return layout(
        <div className="mobile-settings">
            <MobileSection>
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
                        viewMode={ViewMode}
                        loading={loadingViewMode}
                        onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
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
                        <DelaySendSecondsSelect id="delaySendSecondsSelect" delaySendSeconds={DelaySendSeconds} />
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
                        loading={loadingNextMessageOnMoveToggle}
                        nextMessageOnMove={NextMessageOnMove}
                        onToggle={(value) => withLoadingNextMessageOnMoveToggle(handleChangeNextMessageOnMove(value))}
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="swipeLeftAction">{c('Label').t`Swipe left action`}</MobileSectionLabel>
                    <div>
                        <SwipeActionSelect
                            id="swipeLeftAction"
                            value={SwipeLeft}
                            onChange={(swipeAction: SWIPE_ACTION) =>
                                withLoadingSwipeLeft(handleChangeSwipeLeft(swipeAction))
                            }
                            loading={loadingSwipeLeft}
                        />
                    </div>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel htmlFor="swipeRightAction">{c('Label')
                        .t`Swipe right action`}</MobileSectionLabel>
                    <div>
                        <SwipeActionSelect
                            id="swipeRightAction"
                            value={SwipeRight}
                            onChange={(swipeAction: SWIPE_ACTION) =>
                                withLoadingSwipeRight(handleChangeSwipeRight(swipeAction))
                            }
                            loading={loadingSwipeRight}
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
                    <AlmostAllMailToggle id="almostAllMail" showAlmostAllMail={AlmostAllMail} />
                </MobileSectionRow>
                {user.hasPaidMail ? (
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="autoDelete"
                            description={c('Info')
                                .t`Delete trash and spam messages after 30 days. Turning on auto-delete gives messages already in trash/spam a deletion date based on the date they were moved there.`}
                        >{c('Label').t`Auto-delete unwanted messages`}</MobileSectionLabel>
                        <AutoDeleteSpamAndTrashDaysToggle
                            id="autoDelete"
                            loading={loadingAutoDeleteSpamAndTrashDays}
                            autoDeleteSpamAndTrashDays={AutoDeleteSpamAndTrashDays}
                            onToggle={(newValue) =>
                                withLoadingAutoDeleteSpamAndTrashDays(handleAutoDeleteSpamAndTrashDays(newValue))
                            }
                        />
                    </MobileSectionRow>
                ) : null}
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default EmailSettings;
