import { type MouseEvent, Suspense, lazy } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button, Kbd, Tooltip } from '@proton/atoms';
import { ButtonGroup, Icon, useActiveBreakpoint, useContactModals, useToggle } from '@proton/components';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { shiftKey } from '@proton/shared/lib/helpers/browser';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getHasOnlyIcsAttachments, getRecipients, isInternal, isScheduled } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useCategoryViewExperiment } from 'proton-mail/components/categoryView/categoryBadge/useCategoryViewExperiment';
import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { useOnCompose, useOnMailTo } from '../../../containers/ComposeProvider';
import { isSelfAddress } from '../../../helpers/addresses';
import type { MessageViewIcons } from '../../../helpers/message/icon';
import { ComposeTypes } from '../../../hooks/composer/useCompose';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemStar from '../../list/ItemStar';
import ItemSpyTrackerIcon from '../../list/spy-tracker/ItemSpyTrackerIcon';
import MailRecipients from '../recipients/MailRecipients';
import RecipientItem from '../recipients/RecipientItem';
import RecipientType from '../recipients/RecipientType';
import HeaderExtra from './HeaderExtra';
import HeaderMoreDropdown from './HeaderMoreDropdown';

const ExtraMessageCategory = lazy(() => import('../../categoryView/categoryBadge/ExtraMessageCategory'));

interface Props {
    labelID: string;
    labels?: Label[];
    mailSettings: MailSettings;
    message: MessageState;
    messageViewIcons: MessageViewIcons;
    isSentMessage: boolean;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    onResignContact: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onToggle: () => void;
    onBack: () => void;
    onSourceMode: (sourceMode: boolean) => void;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
    filterDropdownToggleRef: React.MutableRefObject<() => void>;
    parentMessageRef: React.RefObject<HTMLElement>;
    conversationIndex?: number;
}

const HeaderExpanded = ({
    labelID,
    labels,
    message,
    messageViewIcons,
    isSentMessage,
    messageLoaded,
    bodyLoaded,
    sourceMode,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    onToggle,
    onBack,
    onSourceMode,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    filterDropdownToggleRef,
    parentMessageRef,
    conversationIndex = 0,
}: Props) => {
    const [addresses = []] = useAddresses();
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    const { canSeeCategoryLabel } = useCategoryViewExperiment();

    const isSendingMessage = message.draftFlags?.sending;
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    const isScheduledMessage = isScheduled(message.data);

    const { Shortcuts } = useMailModel('MailSettings');

    const onCompose = useOnCompose();

    const onMailTo = useOnMailTo();

    const { modals, onDetails: onContactDetails, onEdit: onContactEdit } = useContactModals({ onMailTo });

    const { getRecipientsOrGroups } = useRecipientLabel();
    const recipients = getRecipients(message.data);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);

    // Show trackers icon when body is loaded so that we do not display it before cleaning trackers in links
    const canShowTrackersIcon = bodyLoaded;
    const handleClick = (event: MouseEvent) => {
        if (
            (event.target as HTMLElement).closest('.stop-propagation') ||
            window.getSelection()?.toString().length ||
            document.querySelector('.dropdown')
        ) {
            event.stopPropagation();
            return;
        }
        onToggle();
    };

    const handleAttachmentIconClick = (e: MouseEvent) => {
        e.stopPropagation();
        scrollIntoView(parentMessageRef.current, { block: 'end' });
    };

    const handleCompose = (action: MESSAGE_ACTIONS) => async () => {
        void onCompose({
            type: ComposeTypes.newMessage,
            action,
            referenceMessage: message,
        });
    };

    const hasSigningPublicKey =
        isInternal(message.data) &&
        !isSelfAddress(message.data?.Sender.Address, addresses) &&
        message.verification?.signingPublicKey &&
        message.verification?.verificationStatus !== MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID;

    const hasAttachedPublicKey =
        !isSelfAddress(message.data?.Sender?.Address, addresses) &&
        message.verification?.attachedPublicKeys &&
        message.verification?.verificationStatus !== MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID;

    const showPinPublicKey = hasSigningPublicKey || hasAttachedPublicKey;

    const { viewportWidth } = useActiveBreakpoint();

    const from = (
        <RecipientItem
            message={message}
            recipientOrGroup={{ recipient: message.data?.Sender }}
            isLoading={!messageLoaded}
            signingPublicKey={showPinPublicKey ? message.verification?.signingPublicKey : undefined}
            attachedPublicKey={showPinPublicKey ? message.verification?.attachedPublicKeys?.[0] : undefined}
            globalIcon={messageViewIcons.globalIcon}
            onContactDetails={onContactDetails}
            onContactEdit={onContactEdit}
            customDataTestId="recipients:sender"
            hasHeading
        />
    );

    const titleReply = Shortcuts ? (
        <>
            {c('Title').t`Reply`}
            <br />
            <Kbd shortcut="R" />
        </>
    ) : (
        c('Title').t`Reply`
    );
    const titleReplyAll = Shortcuts ? (
        <>
            {c('Title').t`Reply all`}
            <br />
            <Kbd shortcut={shiftKey} /> + <Kbd shortcut="R" />
        </>
    ) : (
        c('Title').t`Reply all`
    );
    const titleForward = Shortcuts ? (
        <>
            {c('Title').t`Forward`}
            <br />
            <Kbd shortcut={shiftKey} /> + <Kbd shortcut="F" />
        </>
    ) : (
        c('Title').t`Forward`
    );

    return (
        <div
            className={clsx([
                'message-header px-5 message-header-expanded',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                !messageLoaded && 'is-loading',
                showDetails ? 'message-header-expanded--with-details' : 'message-header-expanded--without-details',
            ])}
            data-testid={`message-header-expanded:${conversationIndex}`}
        >
            {canShowTrackersIcon && <ItemSpyTrackerIcon message={message} />}
            {viewportWidth['<=small'] && messageLoaded && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div className="flex items-center justify-space-between my-2" onClick={handleClick}>
                    <span className="inline-flex">
                        <ItemLocation element={message.data} labelID={labelID} />
                        <ItemAttachmentIcon
                            icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                            onClick={handleAttachmentIconClick}
                            element={message.data}
                            className="mr-2"
                        />
                    </span>
                    <ItemDate element={message.data} labelID={labelID} useTooltip className="color-weak text-sm" />
                    <span className="message-header-star mr-2 inline-flex">
                        <ItemStar element={message.data} sourceAction={SOURCE_ACTION.MESSAGE_VIEW} labelID={labelID} />
                    </span>
                </div>
            )}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="flex flex-nowrap items-center message-header-from-container" onClick={handleClick}>
                <span className="flex flex-1 flex-nowrap mr-2">
                    <div className={clsx(['flex flex-nowrap', !messageLoaded && 'flex-1'])}>
                        {viewportWidth['<=small'] ? (
                            <span className="message-header-recipient-mobile">{from}</span>
                        ) : (
                            <RecipientType label={c('Label Recipient').t`From`}>{from}</RecipientType>
                        )}
                        {messageLoaded && isSendingMessage && !isScheduledMessage && (
                            <span className="ml-2 shrink-0 my-auto">
                                <span className="badge-label-primary">{c('Info').t`Sending`}</span>
                            </span>
                        )}
                    </div>
                </span>

                {!viewportWidth['<=small'] && (
                    <div
                        className="message-header-metas-container flex items-center shrink-0"
                        data-testid="message:message-header-metas"
                    >
                        <span className="message-header-star mr-2 inline-flex">
                            <ItemStar
                                sourceAction={SOURCE_ACTION.MESSAGE_VIEW}
                                element={message.data}
                                labelID={labelID}
                            />
                        </span>
                        {messageLoaded && (
                            <>
                                <span className="inline-flex">
                                    <ItemLocation element={message.data} labelID={labelID} />
                                    <ItemAttachmentIcon
                                        icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                        onClick={handleAttachmentIconClick}
                                        element={message.data}
                                        className="mr-2 mt-0.5"
                                    />
                                </span>
                                <ItemDate element={message.data} labelID={labelID} useTooltip className="text-sm" />
                            </>
                        )}
                        {!messageLoaded && <span className="message-header-metas ml-2 inline-flex" />}
                    </div>
                )}
            </div>
            <div
                className={clsx(
                    'flex md:flex-nowrap items-center message-header-ccbcc-container',
                    canSeeCategoryLabel ? '' : 'mb-2'
                )}
            >
                <MailRecipients
                    message={message}
                    recipientsOrGroup={recipientsOrGroup}
                    mapStatusIcons={messageViewIcons.mapStatusIcon}
                    isLoading={!messageLoaded}
                    expanded={showDetails}
                    toggleDetails={toggleDetails}
                    onContactDetails={onContactDetails}
                    onContactEdit={onContactEdit}
                />
            </div>
            {canSeeCategoryLabel && (
                <Suspense fallback={null}>
                    <ExtraMessageCategory message={message} element={message.data} />
                </Suspense>
            )}
            {showDetails && (
                <div className="mb-2 flex flex-nowrap color-weak">
                    <span className="self-center mr-2 text-ellipsis">
                        <ItemDate element={message.data} labelID={labelID} mode="full" useTooltip />
                    </span>
                </div>
            )}

            <HeaderExtra
                message={message}
                sourceMode={sourceMode}
                onResignContact={onResignContact}
                messageLoaded={messageLoaded}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />

            {messageLoaded && (
                <>
                    <div className="mb-3 shrink-0 flex items-center message-header-expanded-label-container">
                        <ItemLabels
                            element={message.data}
                            labelID={labelID}
                            labels={labels}
                            isCollapsed={false}
                            className="pt-1 md:pt-0 ml-2"
                        />
                    </div>
                </>
            )}

            <div className="pt-0 flex justify-space-between">
                <div className="flex">
                    <HeaderMoreDropdown
                        labelID={labelID}
                        message={message}
                        messageLoaded={messageLoaded}
                        sourceMode={sourceMode}
                        onBack={onBack}
                        onToggle={onToggle}
                        onSourceMode={onSourceMode}
                        parentMessageRef={parentMessageRef}
                        mailSettings={mailSettings}
                        messageViewIcons={messageViewIcons}
                        onContactDetails={onContactDetails}
                        onContactEdit={onContactEdit}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        filterDropdownToggleRef={filterDropdownToggleRef}
                    />
                </div>
                {!isScheduledMessage && (
                    <ButtonGroup className="mb-2">
                        <Tooltip title={titleReply}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                                data-testid="message-view:reply"
                            >
                                <Icon name="arrow-up-and-left-big" className="rtl:mirror" alt={c('Title').t`Reply`} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={titleReplyAll}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                                data-testid="message-view:reply-all"
                            >
                                <Icon
                                    name="arrows-up-and-left-big"
                                    className="rtl:mirror"
                                    alt={c('Title').t`Reply all`}
                                />
                            </Button>
                        </Tooltip>
                        <Tooltip title={titleForward}>
                            <Button
                                icon
                                disabled={!messageLoaded || !bodyLoaded || isSendingMessage}
                                onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                                data-testid="message-view:forward"
                            >
                                <Icon
                                    name="arrow-up-and-right-big"
                                    className="rtl:mirror"
                                    alt={c('Title').t`Forward`}
                                />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                )}
            </div>
            {modals}
        </div>
    );
};

export default HeaderExpanded;
