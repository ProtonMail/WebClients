import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ContactEditProps } from '@proton/components';
import {
    ButtonGroup,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    useActiveBreakpoint,
    useApi,
    useModalState,
    useNotifications,
} from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcArrowUpFromSquare } from '@proton/icons/icons/IcArrowUpFromSquare';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcFilter } from '@proton/icons/icons/IcFilter';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFireSlash } from '@proton/icons/icons/IcFireSlash';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { IcHook } from '@proton/icons/icons/IcHook';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';
import { IcPrinter } from '@proton/icons/icons/IcPrinter';
import { IcStar } from '@proton/icons/icons/IcStar';
import { IcStarSlash } from '@proton/icons/icons/IcStarSlash';
import { IcTag } from '@proton/icons/icons/IcTag';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcWindowImage } from '@proton/icons/icons/IcWindowImage';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { getCurrentFolderID } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type {
    MessageState,
    MessageStateWithData,
    MessageWithOptionalBody,
} from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS, MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { isExpiringByRetentionRule } from '@proton/shared/lib/mail/messages';
import useFlag from '@proton/unleash/useFlag';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { formatFileNameDate } from '../../../helpers/date';
import { isStarred as IsMessageStarred, getDate } from '../../../helpers/elements';
import { canSetExpiration, getExpirationTime } from '../../../helpers/expiration';
import { isConversationMode } from '../../../helpers/mailSettings';
import type { MessageViewIcons } from '../../../helpers/message/icon';
import { exportBlob } from '../../../helpers/message/messageExport';
import { useMarkAs } from '../../../hooks/actions/markAs/useMarkAs';
import { useMoveToFolder } from '../../../hooks/actions/move/useMoveToFolder';
import { useGetAttachment } from '../../../hooks/attachments/useAttachment';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import type { Element } from '../../../models/element';
import { updateAttachment } from '../../../store/attachments/attachmentsActions';
import type { DecryptedAttachment } from '../../../store/attachments/attachmentsTypes';
import { expireMessages } from '../../../store/messages/expire/messagesExpireActions';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import LabelDropdown, { labelDropdownContentProps } from '../../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../../dropdown/MoveDropdown';
import CustomExpirationModal from '../modals/CustomExpirationModal';
import MessageDetailsModal from '../modals/MessageDetailsModal';
import MessageHeadersModal from '../modals/MessageHeadersModal';
import MessagePermanentDeleteModal from '../modals/MessagePermanentDeleteModal';
import MessagePhishingModal from '../modals/MessagePhishingModal';
import MessagePrintModal from '../modals/MessagePrintModal';
import type { DropdownRender } from './HeaderDropdown';
import HeaderDropdown from './HeaderDropdown';
import { MESSAGE_FILTER_DROPDOWN_ID, MESSAGE_FOLDER_DROPDOWN_ID, MESSAGE_LABEL_DROPDOWN_ID } from './constants';

interface Props {
    labelID: string;
    message: MessageState;
    messageLoaded: boolean;
    sourceMode: boolean;
    onBack: () => void;
    onToggle: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    parentMessageRef: React.RefObject<HTMLElement>;
    mailSettings: MailSettings;
    messageViewIcons: MessageViewIcons;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
    filterDropdownToggleRef: React.MutableRefObject<() => void>;
}

const HeaderMoreDropdown = ({
    labelID,
    message,
    messageLoaded,
    sourceMode,
    onBack,
    onToggle,
    onSourceMode,
    parentMessageRef,
    mailSettings,
    messageViewIcons,
    onContactDetails,
    onContactEdit,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    filterDropdownToggleRef,
}: Props) => {
    const location = useLocation();
    const api = useApi();
    const getAttachment = useGetAttachment();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const [loading, withLoading] = useLoading();
    const { applyLocation } = useApplyLocation();
    const [user] = useUser();
    const { feature } = useFeature(FeatureCode.SetExpiration);
    const closeDropdown = useRef<() => void>();
    const { moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder();
    const [folders = []] = useFolders();
    const { markAs } = useMarkAs();
    const getMessageKeys = useGetMessageKeys();
    const [{ Shortcuts }] = useMailSettings();
    const [CustomExpirationModalProps, openCustomExpirationModal, renderCustomExpirationModal] = useModalState();
    const dataRetentionPolicyEnabled = useFlag('DataRetentionPolicy');

    const [messageDetailsModalProps, setMessageDetailsModalOpen, renderMessageDetailsModal] = useModalState();
    const [messageHeaderModalProps, setMessageHeaderModalOpen, renderMessageHeaderModal] = useModalState();
    const [messagePrintModalProps, setMessagePrintModalOpen, renderPrintModal] = useModalState();
    const [messagePhishingModalProps, setMessagePhishingModalOpen, renderMessagePhishingModal] = useModalState();
    const [messagePermanentDeleteModalProps, setMessagePermanentDeleteModalOpen, renderMessagePermanentDeleteModal] =
        useModalState();
    const canExpire = canSetExpiration(feature?.Value, user, message);
    const isStarred = IsMessageStarred(message.data || ({} as Element));
    const messageID = message.data?.ID || '';
    const staringText = isStarred ? c('Action').t`Unstar` : c('Action').t`Star`;
    const willExpire = !!message.data?.ExpirationTime;
    const willExpireByRetentionRule = dataRetentionPolicyEnabled && isExpiringByRetentionRule(message.data);

    const handleMove = (folderID: string) => async () => {
        closeDropdown.current?.();

        if (
            labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL &&
            folderID === MAILBOX_LABEL_IDS.TRASH &&
            location.pathname === CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route
        ) {
            dispatch(newsletterSubscriptionsActions.setSelectedElementId(undefined));
        }

        await applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [message.data || ({} as Element)],
            destinationLabelID: folderID,
        });
    };

    // TODO it is possible that this action triggers a move back in some cases.
    // If that's the case we should handle it in the useMoveToParent hook.
    const handleUnread = async () => {
        closeDropdown.current?.();
        onToggle();
        if (isConversationMode(labelID, mailSettings, location)) {
            parentMessageRef.current?.focus();
        } else {
            onBack();
        }
        void markAs({
            elements: [message.data as Element],
            labelID,
            status: MARK_AS_STATUS.UNREAD,
            sourceAction: SOURCE_ACTION.MORE_DROPDOWN,
            silent: true,
        });
    };

    const onUpdateAttachment = (ID: string, attachment: DecryptedAttachment) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    const handleExport = async () => {
        // Angular/src/app/message/directives/actionMessage.js
        const messageKeys = await getMessageKeys(message.data as Message);
        const { Subject = '' } = message.data || {};
        const time = formatFileNameDate(getDate(message.data, labelID));
        const blob = await exportBlob(message, messageKeys, getAttachment, onUpdateAttachment, api);
        const filename = `${Subject} ${time}.eml`;
        downloadFile(blob, filename);
    };

    const handleStar = async () => {
        if (loading) {
            return;
        }

        void withLoading(
            applyLocation({
                type: APPLY_LOCATION_TYPES.STAR,
                removeLabel: isStarred,
                elements: [message.data || ({} as Element)],
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                showSuccessNotification: false,
            })
        );
    };

    const handleExpire = (days: number) => {
        const date = days ? addDays(new Date(), days) : undefined;

        if (date && willExpireByRetentionRule && message.data?.ExpirationTime) {
            const currentExpirationDate = fromUnixTime(message.data.ExpirationTime);
            if (date > currentExpirationDate) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Cannot set expiration longer than retention policy allows.`,
                });
                return;
            }
        }

        const expirationTime = getExpirationTime(date);
        void dispatch(
            expireMessages({
                IDs: [messageID],
                conversationID: message.data?.ConversationID,
                expirationTime,
            })
        );

        createNotification({
            text: days ? c('Success').t`Self-destruction set` : c('Success').t`Self-destruction removed`,
        });
    };

    const handleCustomExpiration = (expirationDate: Date) => {
        const expirationTime = getExpirationTime(expirationDate);
        void dispatch(
            expireMessages({
                IDs: [messageID],
                conversationID: message.data?.ConversationID,
                expirationTime,
            })
        );
        openCustomExpirationModal(false);
        createNotification({ text: c('Success').t`Self-destruction set` });
    };

    const messageLabelIDs = message.data?.LabelIDs || [];
    const selectedIDs = [messageID];
    const isSpam = messageLabelIDs.includes(MAILBOX_LABEL_IDS.SPAM);
    const isInTrash = messageLabelIDs.includes(MAILBOX_LABEL_IDS.TRASH);
    const fromFolderID = getCurrentFolderID(messageLabelIDs, folders);
    const { viewportWidth } = useActiveBreakpoint();
    const additionalDropdowns: DropdownRender[] | undefined = viewportWidth['<=small']
        ? [
              {
                  contentProps: moveDropdownContentProps,
                  render: ({ onClose, onLock }) => (
                      <MoveDropdown
                          labelID={fromFolderID}
                          selectedIDs={selectedIDs}
                          onClose={onClose}
                          onLock={onLock}
                          isMessage
                      />
                  ),
              },
              {
                  contentProps: labelDropdownContentProps,
                  render: ({ onClose, onLock }) => (
                      <LabelDropdown labelID={labelID} selectedIDs={selectedIDs} onClose={onClose} onLock={onLock} />
                  ),
              },
              {
                  render: ({ onClose, onLock }) => (
                      <CustomFilterDropdown message={message.data as Message} onClose={onClose} onLock={onLock} />
                  ),
              },
          ]
        : undefined;

    const titleMoveInboxNotSpam = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox (not spam)`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Title').t`Move to inbox (not spam)`
    );
    const titleUnread = Shortcuts ? (
        <>
            {c('Title').t`Mark as unread`}
            <br />
            <Kbd shortcut="U" />
        </>
    ) : (
        c('Title').t`Mark as unread`
    );
    const titleMoveInbox = Shortcuts ? (
        <>
            {c('Title').t`Move to inbox`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Title').t`Move to inbox`
    );
    const titleMoveTrash = Shortcuts ? (
        <>
            {c('Title').t`Move to trash`}
            <br />
            <Kbd shortcut="T" />
        </>
    ) : (
        c('Title').t`Move to trash`
    );
    const titleMoveTo = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <Kbd shortcut="M" />
        </>
    ) : (
        c('Title').t`Move to`
    );
    const titleLabelAs = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <Kbd shortcut="L" />
        </>
    ) : (
        c('Title').t`Label as`
    );
    const titleFilterOn = Shortcuts ? (
        <>
            {c('Title').t`Filter on...`}
            <br />
            <Kbd shortcut="F" />
        </>
    ) : (
        c('Title').t`Filter on...`
    );

    return (
        <>
            <ButtonGroup className="mr-4 mb-2">
                {isSpam ? (
                    <Tooltip title={titleMoveInboxNotSpam}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(MAILBOX_LABEL_IDS.INBOX)}
                            data-testid="message-header-expanded:move-spam-to-inbox"
                        >
                            <IcFireSlash alt={c('Title').t`Move to inbox (not spam)`} />
                        </Button>
                    </Tooltip>
                ) : (
                    <Tooltip title={titleUnread}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleUnread}
                            data-testid="message-header-expanded:mark-as-unread"
                        >
                            <IcEnvelopeDot alt={c('Title').t`Mark as unread`} />
                        </Button>
                    </Tooltip>
                )}
                {isInTrash ? (
                    <Tooltip title={titleMoveInbox}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(MAILBOX_LABEL_IDS.INBOX)}
                            data-testid="message-header-expanded:move-trashed-to-inbox"
                        >
                            <IcInbox alt={c('Title').t`Move to inbox`} />
                        </Button>
                    </Tooltip>
                ) : (
                    <Tooltip title={titleMoveTrash}>
                        <Button
                            icon
                            disabled={!messageLoaded}
                            onClick={handleMove(MAILBOX_LABEL_IDS.TRASH)}
                            data-testid="message-header-expanded:move-to-trash"
                        >
                            <IcTrash alt={c('Title').t`Move to trash`} />
                        </Button>
                    </Tooltip>
                )}
                {!viewportWidth['<=small'] && [
                    <HeaderDropdown
                        key={MESSAGE_FOLDER_DROPDOWN_ID}
                        id={MESSAGE_FOLDER_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
                        content={<IcFolderArrowIn alt={c('Action').t`Move to`} />}
                        className="messageMoveDropdownButton"
                        dropDownClassName="move-dropdown"
                        title={titleMoveTo}
                        loading={!messageLoaded}
                        externalToggleRef={moveDropdownToggleRef}
                        data-testid={MESSAGE_FOLDER_DROPDOWN_ID}
                    >
                        {{
                            contentProps: moveDropdownContentProps,
                            render: ({ onClose, onLock }) => (
                                <MoveDropdown
                                    labelID={fromFolderID}
                                    selectedIDs={selectedIDs}
                                    onClose={onClose}
                                    onLock={onLock}
                                    isMessage
                                />
                            ),
                        }}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key={MESSAGE_LABEL_DROPDOWN_ID}
                        id={MESSAGE_LABEL_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: '22em', maxHeight: DropdownSizeUnit.Viewport }}
                        content={<IcTag alt={c('Action').t`Label as`} />}
                        className="messageLabelDropdownButton"
                        dropDownClassName="label-dropdown"
                        title={titleLabelAs}
                        loading={!messageLoaded}
                        externalToggleRef={labelDropdownToggleRef}
                        data-testid={MESSAGE_LABEL_DROPDOWN_ID}
                    >
                        {{
                            contentProps: labelDropdownContentProps,
                            render: ({ onClose, onLock }) => (
                                <LabelDropdown
                                    labelID={labelID}
                                    selectedIDs={selectedIDs}
                                    onClose={onClose}
                                    onLock={onLock}
                                />
                            ),
                        }}
                    </HeaderDropdown>,
                    <HeaderDropdown
                        key={MESSAGE_FILTER_DROPDOWN_ID}
                        id={MESSAGE_FILTER_DROPDOWN_ID}
                        icon
                        autoClose={false}
                        dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                        content={<IcFilter alt={c('Action').t`Filter on...`} />}
                        className="messageFilterDropdownButton"
                        dropDownClassName="filter-dropdown"
                        title={titleFilterOn}
                        loading={!messageLoaded}
                        externalToggleRef={filterDropdownToggleRef}
                        data-testid={MESSAGE_FILTER_DROPDOWN_ID}
                    >
                        {{
                            render: ({ onClose, onLock }) => (
                                <CustomFilterDropdown
                                    message={message.data as Message}
                                    onClose={onClose}
                                    onLock={onLock}
                                />
                            ),
                        }}
                    </HeaderDropdown>,
                ]}
                <HeaderDropdown
                    icon
                    disabled={!messageLoaded}
                    autoClose
                    title={c('Title').t`More`}
                    content={<IcThreeDotsHorizontal alt={c('Title').t`More options`} />}
                    additionalDropdowns={additionalDropdowns}
                    data-testid="message-header-expanded:more-dropdown"
                    dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                >
                    {{
                        render: ({ onClose, onOpenAdditional }) => {
                            closeDropdown.current = onClose;
                            return (
                                <DropdownMenu>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleStar}
                                        data-testid="message-view-more-dropdown:star"
                                    >
                                        {isStarred ? <IcStarSlash className="mr-2" /> : <IcStar className="mr-2" />}
                                        <span className="flex-1 my-auto">{staringText}</span>
                                    </DropdownMenuButton>

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleMove(MAILBOX_LABEL_IDS.ARCHIVE)}
                                        data-testid="message-view-more-dropdown:archive"
                                    >
                                        <IcArchiveBox className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Archive`}</span>
                                    </DropdownMenuButton>
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(0)}
                                        >
                                            <IcFolderArrowIn className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Move to...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(1)}
                                        >
                                            <IcTag className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Label as...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {viewportWidth['<=small'] && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onOpenAdditional(2)}
                                        >
                                            <IcFilter className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Filter on...`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {isSpam ? (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={handleUnread}
                                            data-testid="message-view-more-dropdown:unread"
                                        >
                                            <IcEyeSlash className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Mark as unread`}</span>
                                        </DropdownMenuButton>
                                    ) : (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={handleMove(MAILBOX_LABEL_IDS.SPAM)}
                                            data-testid="message-view-more-dropdown:move-to-spam"
                                        >
                                            <IcFire className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Move to spam`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {isInTrash ? (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => setMessagePermanentDeleteModalOpen(true)}
                                            data-testid="message-view-more-dropdown:delete"
                                        >
                                            <IcCrossCircle className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`Delete`}</span>
                                        </DropdownMenuButton>
                                    ) : null}
                                    {canExpire ? (
                                        <>
                                            <hr className="my-2" />
                                            {willExpire && !willExpireByRetentionRule ? (
                                                <DropdownMenuButton
                                                    className="text-left flex flex-nowrap items-center"
                                                    onClick={() => handleExpire(0)}
                                                    data-testid="message-view-more-dropdown:remove-expiration"
                                                >
                                                    <IcHourglass className="mr-2" />
                                                    <span className="flex-1 my-auto">{c('Action')
                                                        .t`Remove self-destruction`}</span>
                                                </DropdownMenuButton>
                                            ) : (
                                                <>
                                                    <DropdownMenuButton
                                                        className="text-left flex flex-nowrap items-center"
                                                        onClick={() => handleExpire(7)}
                                                        data-testid="message-view-more-dropdown:expire-7-days"
                                                    >
                                                        <IcHourglass className="mr-2" />
                                                        <span className="flex-1 my-auto">{c('Action')
                                                            .t`Self-destruct in 7 days`}</span>
                                                    </DropdownMenuButton>
                                                    <DropdownMenuButton
                                                        className="text-left flex flex-nowrap items-center"
                                                        onClick={() => openCustomExpirationModal(true)}
                                                        data-testid="message-view-more-dropdown:expire-30-days"
                                                    >
                                                        <IcHourglass className="mr-2" />
                                                        <span className="flex-1 my-auto">{c('Action')
                                                            .t`Self-destruct on ...`}</span>
                                                    </DropdownMenuButton>
                                                </>
                                            )}
                                        </>
                                    ) : null}

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={handleExport}
                                        data-testid="message-view-more-dropdown:export"
                                    >
                                        <IcArrowUpFromSquare className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Export`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessagePrintModalOpen(true)}
                                        data-testid="message-view-more-dropdown:print"
                                    >
                                        <IcPrinter className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`Print`}</span>
                                    </DropdownMenuButton>

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessageDetailsModalOpen(true)}
                                        data-testid="message-view-more-dropdown:view-message-details"
                                    >
                                        <IcListBullets className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`View message details`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center"
                                        onClick={() => setMessageHeaderModalOpen(true)}
                                        data-testid="message-view-more-dropdown:view-message-headers"
                                    >
                                        <IcWindowTerminal className="mr-2" />
                                        <span className="flex-1 my-auto">{c('Action').t`View headers`}</span>
                                    </DropdownMenuButton>
                                    {!sourceMode && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onSourceMode(true)}
                                            data-testid="message-view-more-dropdown:view-html"
                                        >
                                            <IcCode className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`View HTML`}</span>
                                        </DropdownMenuButton>
                                    )}
                                    {sourceMode && (
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center"
                                            onClick={() => onSourceMode(false)}
                                            data-testid="message-view-more-dropdown:view-rendered-html"
                                        >
                                            <IcWindowImage className="mr-2" />
                                            <span className="flex-1 my-auto">{c('Action').t`View rendered HTML`}</span>
                                        </DropdownMenuButton>
                                    )}

                                    <hr className="my-2" />

                                    <DropdownMenuButton
                                        className="text-left flex flex-nowrap items-center color-danger"
                                        onClick={() => setMessagePhishingModalOpen(true)}
                                        data-testid="message-view-more-dropdown:report-phishing"
                                    >
                                        <IcHook className="mr-2 color-danger" />
                                        <span className="flex-1 my-auto color-danger">{c('Action')
                                            .t`Report phishing`}</span>
                                    </DropdownMenuButton>
                                </DropdownMenu>
                            );
                        },
                    }}
                </HeaderDropdown>
            </ButtonGroup>
            {renderMessageDetailsModal && (
                <MessageDetailsModal
                    labelID={labelID}
                    message={message}
                    mailSettings={mailSettings}
                    messageViewIcons={messageViewIcons}
                    messageLoaded={messageLoaded}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                    {...messageDetailsModalProps}
                />
            )}
            {renderMessageHeaderModal && <MessageHeadersModal message={message.data} {...messageHeaderModalProps} />}
            {renderPrintModal && (
                <MessagePrintModal
                    message={message as MessageStateWithData}
                    labelID={labelID}
                    {...messagePrintModalProps}
                />
            )}
            {renderMessagePhishingModal && (
                <MessagePhishingModal message={message} onBack={onBack} {...messagePhishingModalProps} />
            )}
            {renderMessagePermanentDeleteModal && (
                <MessagePermanentDeleteModal
                    message={message.data as MessageWithOptionalBody}
                    {...messagePermanentDeleteModalProps}
                />
            )}
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {renderCustomExpirationModal && (
                <CustomExpirationModal
                    onSubmit={handleCustomExpiration}
                    message={message}
                    {...CustomExpirationModalProps}
                />
            )}
        </>
    );
};

export default HeaderMoreDropdown;
