import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import {
    classnames,
    Icon,
    Group,
    useToggle,
    useFolders,
    ButtonGroup as OriginalButtonGroup,
    Tooltip,
    useAddresses,
    useMailSettings,
} from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { isInternal, isOutbox } from 'proton-shared/lib/mail/messages';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { shiftKey } from 'proton-shared/lib/helpers/browser';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import { MESSAGE_ACTIONS } from '../../../constants';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { getCurrentFolderID } from '../../../helpers/labels';
import HeaderExtra from './HeaderExtra';
import RecipientsSimple from '../recipients/RecipientsSimple';
import RecipientsDetails from '../recipients/RecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import HeaderDropdown from './HeaderDropdown';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import HeaderExpandedDetails from './HeaderExpandedDetails';
import RecipientType from '../recipients/RecipientType';
import RecipientItem from '../recipients/RecipientItem';
import { OnCompose } from '../../../hooks/composer/useCompose';
import { Breakpoints } from '../../../models/utils';
import ItemAction from '../../list/ItemAction';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { isSelfAddress } from '../../../helpers/addresses';

// Hacky override of the typing
const ButtonGroup = OriginalButtonGroup as ({
    children,
    className,
    ...rest
}: {
    [x: string]: any;
    children?: any;
    className?: string | undefined;
}) => JSX.Element;

interface Props {
    labelID: string;
    conversationMode: boolean;
    labels?: Label[];
    mailSettings: MailSettings;
    message: MessageExtended;
    messageViewIcons: MessageViewIcons;
    isSentMessage: boolean;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    onResignContact: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCollapse: () => void;
    onBack: () => void;
    onCompose: OnCompose;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
    labelDropdownToggleRef: React.MutableRefObject<() => void>;
    moveDropdownToggleRef: React.MutableRefObject<() => void>;
    filterDropdownToggleRef: React.MutableRefObject<() => void>;
}

const HeaderExpanded = ({
    labelID,
    conversationMode,
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
    onCollapse,
    onBack,
    onCompose,
    onSourceMode,
    breakpoints,
    labelDropdownToggleRef,
    moveDropdownToggleRef,
    filterDropdownToggleRef,
}: Props) => {
    const [addresses = []] = useAddresses();
    const [folders = []] = useFolders();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const selectedIDs = [message.data?.ID || ''];
    const currentFolderID = getCurrentFolderID(message.data?.LabelIDs, folders);
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();
    const inOutbox = isOutbox(message.data);

    const handleClick = (event: MouseEvent) => {
        if (
            (event.target as HTMLElement).closest('.stop-propagation') ||
            window.getSelection()?.toString().length ||
            document.querySelector('.dropdown')
        ) {
            event.stopPropagation();
            return;
        }
        onCollapse();
    };

    const handleCompose = (action: MESSAGE_ACTIONS) => () => {
        onCompose({
            action,
            referenceMessage: message,
        });
    };

    const showPinPublicKey =
        isInternal(message.data) &&
        !isSelfAddress(message.data?.Sender.Address, addresses) &&
        message.verification?.signingPublicKey &&
        message.verification?.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID;

    const from = (
        <RecipientItem
            recipientOrGroup={{ recipient: message.data?.Sender }}
            onCompose={onCompose}
            isLoading={!messageLoaded}
            signingPublicKey={showPinPublicKey ? message.verification?.signingPublicKey : undefined}
        />
    );

    const { isNarrow } = breakpoints;

    const titleReply = Shortcuts ? (
        <>
            {c('Title').t`Reply`}
            <br />
            <kbd className="bg-global-altgrey no-border">R</kbd>
        </>
    ) : (
        c('Title').t`Reply`
    );
    const titleReplyAll = Shortcuts ? (
        <>
            {c('Title').t`Reply all`}
            <br />
            <kbd className="bg-global-altgrey no-border">{shiftKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey no-border">R</kbd>
        </>
    ) : (
        c('Title').t`Reply all`
    );
    const titleForward = Shortcuts ? (
        <>
            {c('Title').t`Forward`}
            <br />
            <kbd className="bg-global-altgrey no-border">{shiftKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey no-border">F</kbd>
        </>
    ) : (
        c('Title').t`Forward`
    );
    const titleFilterOn = Shortcuts ? (
        <>
            {c('Title').t`Filter on`}
            <br />
            <kbd className="bg-global-altgrey no-border">F</kbd>
        </>
    ) : (
        c('Title').t`Filter on`
    );
    const titleMoveTo = Shortcuts ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <kbd className="bg-global-altgrey no-border">M</kbd>
        </>
    ) : (
        c('Title').t`Move to`
    );
    const titleLabelAs = Shortcuts ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <kbd className="bg-global-altgrey no-border">L</kbd>
        </>
    ) : (
        c('Title').t`Label as`
    );

    return (
        <div
            className={classnames([
                'message-header message-header-expanded',
                showDetails && 'message-header--showDetails',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                !messageLoaded && 'is-loading',
            ])}
        >
            <div className="flex flex-nowrap flex-align-items-center cursor-pointer" onClick={handleClick}>
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    {showDetails ? (
                        <RecipientType
                            label={c('Label').t`From:`}
                            className={classnames([
                                'flex flex-align-items-start flex-nowrap',
                                !messageLoaded && 'flex-item-fluid',
                            ])}
                        >
                            {from}
                        </RecipientType>
                    ) : (
                        <div className={classnames(['flex flex-nowrap', !messageLoaded && 'flex-item-fluid'])}>
                            {from}
                        </div>
                    )}
                </span>
                <div
                    className={classnames([
                        'message-header-metas-container flex flex-align-items-center flex-item-noshrink',
                        isNarrow && 'flex-align-self-start',
                    ])}
                >
                    {messageLoaded && !showDetails && (
                        <>
                            <span className="inline-flex">
                                <ItemAction element={message.data} className="flex-item-noshrink" />
                                <EncryptionStatusIcon {...messageViewIcons.globalIcon} className="mr0-5" />
                                <ItemLocation element={message.data} labelID={labelID} />
                            </span>
                            {!isNarrow && <ItemDate className="ml0-5" element={message.data} labelID={labelID} />}
                        </>
                    )}
                    {messageLoaded && showDetails && (
                        <span className="ml0-5 inline-flex">
                            <ItemAction element={message.data} className="flex-item-noshrink" />
                        </span>
                    )}
                    {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex" />}
                    <span className="message-header-star ml0-5 inline-flex">
                        <ItemStar element={message.data} />
                    </span>
                </div>
            </div>
            <div
                className={classnames([
                    'flex flex-nowrap flex-align-items-center mb0-5 on-mobile-flex-wrap',
                    !showDetails && 'mt0-5',
                ])}
            >
                <div className="flex-item-fluid flex flex-nowrap mr0-5 on-mobile-mr0 message-header-recipients">
                    {showDetails ? (
                        <RecipientsDetails
                            message={message}
                            mapStatusIcons={messageViewIcons.mapStatusIcon}
                            onCompose={onCompose}
                            isLoading={!messageLoaded}
                        />
                    ) : (
                        <RecipientsSimple message={message.data} isLoading={!messageLoaded} />
                    )}
                    <span
                        className={classnames([
                            'message-show-hide-link-container flex-item-noshrink',
                            showDetails ? 'mt0-25 on-mobile-mt0-5' : 'ml0-5',
                        ])}
                    >
                        {messageLoaded && (
                            <button
                                type="button"
                                onClick={toggleDetails}
                                className="message-show-hide-link button--link align-baseline"
                                disabled={!messageLoaded}
                            >
                                {showDetails
                                    ? c('Action').t`Hide details`
                                    : isNarrow
                                    ? c('Action').t`Details`
                                    : c('Action').t`Show details`}
                            </button>
                        )}
                    </span>
                </div>
                {messageLoaded && !showDetails && !isNarrow && (
                    <>
                        <div className="flex-item-noshrink flex flex-align-items-center message-header-expanded-label-container">
                            <ItemLabels
                                element={message.data}
                                labelID={labelID}
                                labels={labels}
                                showUnlabel
                                maxNumber={5}
                                className="on-mobile-pt0-25"
                            />
                            <ItemAttachmentIcon element={message.data} className="ml0-5" />
                        </div>
                    </>
                )}
            </div>

            {!showDetails && isNarrow && (
                <div className="flex flex-justify-space-between flex-align-items-center border-top pt0-5 mb0-5">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap flex-align-items-center">
                                <Icon name="calendar" className="ml0-5 mr0-5" />
                                <ItemDate element={message.data} labelID={labelID} />
                            </div>
                            <div className="mlauto flex flex-nowrap">
                                <ItemLabels
                                    element={message.data}
                                    labelID={labelID}
                                    labels={labels}
                                    showUnlabel
                                    maxNumber={1}
                                />
                                <ItemAttachmentIcon element={message.data} className="ml0-5" />
                            </div>
                        </>
                    ) : (
                        <span className="message-header-metas inline-flex" />
                    )}
                </div>
            )}

            {showDetails && (
                <HeaderExpandedDetails
                    labelID={labelID}
                    message={message}
                    messageViewIcons={messageViewIcons}
                    labels={labels}
                    mailSettings={mailSettings}
                />
            )}

            <HeaderExtra
                message={message}
                sourceMode={sourceMode}
                onResignContact={onResignContact}
                messageLoaded={messageLoaded}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
                onCompose={onCompose}
            />

            <div className="pt0-5 flex flex-justify-space-between border-top">
                <div className="flex">
                    <HeaderMoreDropdown
                        labelID={labelID}
                        message={message}
                        messageLoaded={messageLoaded}
                        sourceMode={sourceMode}
                        onBack={onBack}
                        onCollapse={onCollapse}
                        onSourceMode={onSourceMode}
                        breakpoints={breakpoints}
                    />

                    {!isNarrow && (
                        <Group className="mr1 mb0-5">
                            <HeaderDropdown
                                autoClose={false}
                                content={<Icon name="filter" alt={c('Action').t`Custom filter`} />}
                                className="button grouped-button button--for-icon messageFilterDropdownButton"
                                dropDownClassName="customFilterDropdown"
                                title={titleFilterOn}
                                loading={!messageLoaded}
                                externalToggleRef={filterDropdownToggleRef}
                            >
                                {({ onClose }) => (
                                    <CustomFilterDropdown message={message.data as Message} onClose={onClose} />
                                )}
                            </HeaderDropdown>
                            <HeaderDropdown
                                autoClose={false}
                                noMaxSize
                                content={<Icon name="folder" alt={c('Action').t`Move to`} />}
                                className="button grouped-button button--for-icon messageMoveDropdownButton"
                                dropDownClassName="move-dropdown"
                                title={titleMoveTo}
                                loading={!messageLoaded}
                                externalToggleRef={moveDropdownToggleRef}
                            >
                                {({ onClose, onLock }) => (
                                    <MoveDropdown
                                        labelID={currentFolderID}
                                        selectedIDs={selectedIDs}
                                        conversationMode={conversationMode}
                                        onClose={onClose}
                                        onLock={onLock}
                                        onBack={onBack}
                                        breakpoints={breakpoints}
                                    />
                                )}
                            </HeaderDropdown>
                            <HeaderDropdown
                                autoClose={false}
                                noMaxSize
                                content={<Icon name="label" alt={c('Action').t`Label as`} />}
                                className="button grouped-button button--for-icon messageLabelDropdownButton"
                                dropDownClassName="label-dropdown"
                                title={titleLabelAs}
                                loading={!messageLoaded}
                                externalToggleRef={labelDropdownToggleRef}
                            >
                                {({ onClose, onLock }) => (
                                    <LabelDropdown
                                        labelID={labelID}
                                        labels={labels}
                                        selectedIDs={selectedIDs}
                                        onClose={onClose}
                                        onLock={onLock}
                                        breakpoints={breakpoints}
                                    />
                                )}
                            </HeaderDropdown>
                        </Group>
                    )}
                </div>

                <Group className="mb0-5">
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded || inOutbox}
                        className="button--for-icon button--primary flex flex-align-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                        data-test-id="message-view:reply"
                    >
                        <Tooltip title={titleReply} className="flex increase-click-surface">
                            <Icon name="reply" size={20} alt={c('Title').t`Reply`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded || inOutbox}
                        className="button--for-icon button--primary flex flex-align-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                        data-test-id="message-view:reply-all"
                    >
                        <Tooltip title={titleReplyAll} className="flex increase-click-surface">
                            <Icon name="reply-all" size={20} alt={c('Title').t`Reply all`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded || inOutbox}
                        className=" button--for-icon button--primary flex flex-align-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                        data-test-id="message-view:forward"
                    >
                        <Tooltip title={titleForward} className="flex increase-click-surface">
                            <Icon name="forward" size={20} alt={c('Title').t`Forward`} />
                        </Tooltip>
                    </ButtonGroup>
                </Group>
            </div>
            {/* {messageLoaded ? <HeaderAttachmentEvent message={message} /> : null} */}
        </div>
    );
};

export default HeaderExpanded;
