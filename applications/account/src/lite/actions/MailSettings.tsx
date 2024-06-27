import { ReactNode, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AlmostAllMailToggle,
    AutoDeleteSpamAndTrashDaysToggle,
    DelaySendSecondsSelect,
    EmbeddedToggle,
    NextMessageOnMoveToggle,
    RemoteToggle,
    RequestLinkConfirmationToggle,
    SenderImagesToggle,
    ShowMovedToggle,
    SwipeActionSelect,
    ViewModeToggle,
    useAddresses,
    useApi,
    useEventManager,
    useMailSettings,
    useModalState,
    useNotifications,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import {
    updateAutoDelete,
    updateNextMessageOnMove,
    updateStickyLabels,
    updateSwipeLeft,
    updateSwipeRight,
    updateViewMode,
} from '@proton/shared/lib/api/mailSettings';
import {
    AUTO_DELETE_SPAM_AND_TRASH_DAYS,
    DEFAULT_MAILSETTINGS,
    STICKY_LABELS,
    SWIPE_ACTION,
    VIEW_MODE,
} from '@proton/shared/lib/mail/mailSettings';

import EditProfileModal from '../components/EditProfileModal';
import MobileSection from '../components/MobileSection';
import MobileSectionAction from '../components/MobileSectionAction';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';
import { SupportedActions } from '../helper';

import './MobileSettings.scss';

const MailSettings = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    const api = useApi();
    const history = useHistory();
    const location = useLocation();
    const [addresses = []] = useAddresses();
    const [firstAddress] = addresses;
    const { Email = '', DisplayName = '', Signature = '' } = firstAddress || {};
    const { call } = useEventManager();
    const [loadingAutoDeleteSpamAndTrashDays, withLoadingAutoDeleteSpamAndTrashDays] = useLoading();
    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingSwipeLeft, withLoadingSwipeLeft] = useLoading();
    const [loadingSwipeRight, withLoadingSwipeRight] = useLoading();
    const [loadingNextMessageOnMoveToggle, withLoadingNextMessageOnMoveToggle] = useLoading();
    const [
        {
            AutoDeleteSpamAndTrashDays,
            AlmostAllMail,
            ConfirmLink,
            DelaySendSeconds,
            SwipeLeft,
            SwipeRight,
            ViewMode,
            HideEmbeddedImages,
            HideRemoteImages,
            NextMessageOnMove,
        } = DEFAULT_MAILSETTINGS,
    ] = useMailSettings();
    const { createNotification } = useNotifications();
    const [hideRemoteImages, setHideRemoteImages] = useState(HideRemoteImages);
    const [hideEmbeddedImages, setHideEmbeddedImages] = useState(HideEmbeddedImages);
    const [profileModalProps, setProfileModal, renderProfileModal] = useModalState();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeViewMode = async (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            await api(updateStickyLabels(STICKY_LABELS.DISABLED));
        }
        await api(updateViewMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeSwipeLeft = async (swipeAction: SWIPE_ACTION) => {
        await api(updateSwipeLeft(swipeAction));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeSwipeRight = async (swipeAction: SWIPE_ACTION) => {
        await api(updateSwipeRight(swipeAction));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeHideEmbedded = (newValue: number) => setHideEmbeddedImages(newValue);
    const handleChangeShowImage = (newValue: number) => setHideRemoteImages(newValue);

    const handleChangeNextMessageOnMove = async (nextMessageOnMove: number) => {
        await api(updateNextMessageOnMove(nextMessageOnMove));
        await call();
        notifyPreferenceSaved();
    };

    const handleAutoDeleteSpamAndTrashDays = async (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        await api(updateAutoDelete(autoDelete));
        await call();
        notifyPreferenceSaved();
    };

    const handleClickIdentityDetails = () => {
        setProfileModal(true);
    };

    const handleRedirect = (action: SupportedActions) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('action', action);
        history.push(location.pathname, { search: searchParams.toString() });
    };

    return layout(
        <>
            {renderProfileModal && <EditProfileModal address={firstAddress} {...profileModalProps} />}
            <div className="mobile-settings">
                <MobileSection title={c('Title').t`Profile`}>
                    <MobileSectionRow stackContent>
                        <MobileSectionLabel small htmlFor="email">{c('Label').t`Email address`}</MobileSectionLabel>
                        <div className="text-lg mt-0.5">{Email}</div>
                    </MobileSectionRow>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="displayName">{c('Label')
                            .t`Display name`}</MobileSectionLabel>
                        <div className="text-lg mt-0.5">{DisplayName}</div>
                    </MobileSectionAction>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="signature">{c('Label').t`Signature`}</MobileSectionLabel>
                        <div className="mt-0.5" id="signature" dangerouslySetInnerHTML={{ __html: Signature }} />
                    </MobileSectionAction>
                </MobileSection>
                <MobileSection title={c('Label').t`Mail settings`}>
                    <MobileSectionAction onClick={() => handleRedirect(SupportedActions.LabelsSettings)}>
                        {c('Label').t`Folders and labels`}
                    </MobileSectionAction>
                    <MobileSectionAction onClick={() => handleRedirect(SupportedActions.SpamFiltersSettings)}>
                        {c('Label').t`Spam and filters`}
                    </MobileSectionAction>
                    <MobileSectionAction onClick={() => handleRedirect(SupportedActions.AccountRecovery)}>
                        {c('Label').t`Account recovery`}
                    </MobileSectionAction>
                    <MobileSectionRow>
                        <MobileSectionLabel htmlFor="auto-advance">{c('Label').t`Auto-advance`}</MobileSectionLabel>
                        <NextMessageOnMoveToggle
                            id="auto-advance"
                            loading={loadingNextMessageOnMoveToggle}
                            nextMessageOnMove={NextMessageOnMove}
                            onToggle={(value) =>
                                withLoadingNextMessageOnMoveToggle(handleChangeNextMessageOnMove(value))
                            }
                        />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="showMovedToggle"
                            description={c('Info')
                                .t`Messages in the Sent or Drafts folder will continue to appear in that folder, even if you move them to another folder.`}
                        >
                            {c('Label').t`Keep messages in Sent/Drafts`}
                        </MobileSectionLabel>
                        <ShowMovedToggle id="showMovedToggle" />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="viewMode"
                            description={c('Info')
                                .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                        >{c('Label').t`Conversation grouping`}</MobileSectionLabel>
                        <ViewModeToggle
                            id="viewMode"
                            viewMode={ViewMode}
                            loading={loadingViewMode}
                            onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
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
                        <MobileSectionLabel htmlFor="swipeLeftAction">{c('Label')
                            .t`Swipe left action`}</MobileSectionLabel>
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
                            htmlFor="embeddedToggle"
                            description={c('Info')
                                .t`When disabled, this prevents image files from loading on your device without your knowledge.`}
                        >{c('Label').t`Auto-load embedded images`}</MobileSectionLabel>
                        <EmbeddedToggle
                            id="embeddedToggle"
                            hideEmbeddedImages={hideEmbeddedImages}
                            onChange={handleChangeHideEmbedded}
                        />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="remoteToggle"
                            description={c('Info')
                                .t`Loaded content is being protected by our proxy when tracker protection is activated.`}
                        >{c('Label').t`Auto-load remote content`}</MobileSectionLabel>
                        <RemoteToggle
                            id="remoteToggle"
                            hideRemoteImages={hideRemoteImages}
                            onChange={handleChangeShowImage}
                        />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="requestLinkConfirmationToggle"
                            description={c('Info')
                                .t`When you click on a link, this anti-phishing feature will ask you to confirm the URL of the web page.`}
                        >
                            {c('Label').t`Confirm link URLs`}
                        </MobileSectionLabel>
                        <RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel htmlFor="autoDelete">{c('Label')
                            .t`Auto-delete unwanted messages`}</MobileSectionLabel>
                        <AutoDeleteSpamAndTrashDaysToggle
                            id="autoDelete"
                            loading={loadingAutoDeleteSpamAndTrashDays}
                            autoDeleteSpamAndTrashDays={AutoDeleteSpamAndTrashDays}
                            onToggle={(newValue) =>
                                withLoadingAutoDeleteSpamAndTrashDays(handleAutoDeleteSpamAndTrashDays(newValue))
                            }
                        />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel
                            htmlFor="senderImages"
                            description={c('Info')
                                .t`Show each sender's image in the message list. The sender's initials will be shown if a photo is not available.`}
                        >{c('Label').t`Show sender images`}</MobileSectionLabel>
                        <SenderImagesToggle id="senderImages" />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel htmlFor="almostAllMail">{c('Label')
                            .t`Exclude Spam/Trash from All mail`}</MobileSectionLabel>
                        <AlmostAllMailToggle id="almostAllMail" showAlmostAllMail={AlmostAllMail} />
                    </MobileSectionRow>
                </MobileSection>
            </div>
        </>,
        { className: 'overflow-auto' }
    );
};

export default MailSettings;
