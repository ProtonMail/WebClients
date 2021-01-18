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
import { isInternal } from 'proton-shared/lib/mail/messages';
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
    const [{ Hotkeys } = { Hotkeys: 0 }] = useMailSettings();

    const handleClick = (event: MouseEvent) => {
        if (
            (event.target as HTMLElement).closest('.stop-propagation') ||
            window.getSelection()?.toString().length ||
            document.querySelector('.dropDown')
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

    const titleReply = Hotkeys ? (
        <>
            {c('Title').t`Reply`}
            <br />
            <kbd className="bg-global-altgrey noborder">R</kbd>
        </>
    ) : (
        c('Title').t`Reply`
    );
    const titleReplyAll = Hotkeys ? (
        <>
            {c('Title').t`Reply all`}
            <br />
            <kbd className="bg-global-altgrey noborder">{shiftKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey noborder">R</kbd>
        </>
    ) : (
        c('Title').t`Reply all`
    );
    const titleForward = Hotkeys ? (
        <>
            {c('Title').t`Forward`}
            <br />
            <kbd className="bg-global-altgrey noborder">{shiftKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey noborder">F</kbd>
        </>
    ) : (
        c('Title').t`Forward`
    );
    const titleFilterOn = Hotkeys ? (
        <>
            {c('Title').t`Filter on`}
            <br />
            <kbd className="bg-global-altgrey noborder">F</kbd>
        </>
    ) : (
        c('Title').t`Filter on`
    );
    const titleMoveTo = Hotkeys ? (
        <>
            {c('Title').t`Move to`}
            <br />
            <kbd className="bg-global-altgrey noborder">M</kbd>
        </>
    ) : (
        c('Title').t`Move to`
    );
    const titleLabelAs = Hotkeys ? (
        <>
            {c('Title').t`Label as`}
            <br />
            <kbd className="bg-global-altgrey noborder">L</kbd>
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
            <div className="flex flex-nowrap flex-items-center cursor-pointer" onClick={handleClick}>
                <span className="flex flex-item-fluid flex-nowrap mr0-5">
                    {showDetails ? (
                        <RecipientType
                            label={c('Label').t`From:`}
                            className={classnames([
                                'flex flex-items-start flex-nowrap',
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
                        'message-header-metas-container flex flex-items-center flex-item-noshrink',
                        isNarrow && 'flex-self-start',
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
                    'flex flex-nowrap flex-items-center mb0-5 onmobile-flex-wrap',
                    !showDetails && 'mt0-5',
                ])}
            >
                <div className="flex-item-fluid flex flex-nowrap mr0-5 onmobile-mr0 message-header-recipients">
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
                            showDetails ? 'mt0-25 onmobile-mt0-5' : 'ml0-5',
                        ])}
                    >
                        {messageLoaded && (
                            <button
                                type="button"
                                onClick={toggleDetails}
                                className="message-show-hide-link pm-button--link alignbaseline"
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
                        <div className="flex-item-noshrink flex flex-items-center message-header-expanded-label-container">
                            <ItemLabels
                                element={message.data}
                                labelID={labelID}
                                labels={labels}
                                showUnlabel
                                maxNumber={5}
                                className="onmobile-pt0-25"
                            />
                            <ItemAttachmentIcon element={message.data} labelID={labelID} className="ml0-5" />
                        </div>
                    </>
                )}
            </div>

            {!showDetails && isNarrow && (
                <div className="flex flex-spacebetween flex-items-center border-top pt0-5 mb0-5">
                    {messageLoaded ? (
                        <>
                            <div className="flex flex-nowrap flex-items-center">
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
                                <ItemAttachmentIcon element={message.data} labelID={labelID} className="ml0-5" />
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

            <div className="pt0-5 flex flex-spacebetween border-top">
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
                                className="pm-button pm-group-button pm-button--for-icon messageFilterDropdownButton"
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
                                className="pm-button pm-group-button pm-button--for-icon messageMoveDropdownButton"
                                dropDownClassName="moveDropdown"
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
                                className="pm-button pm-group-button pm-button--for-icon messageLabelDropdownButton"
                                dropDownClassName="labelDropdown"
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
                        disabled={!messageLoaded || !bodyLoaded}
                        className="pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                    >
                        <Tooltip title={titleReply} className="flex increase-surface-click">
                            <Icon name="reply" size={20} alt={c('Title').t`Reply`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded}
                        className="pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                    >
                        <Tooltip title={titleReplyAll} className="flex increase-surface-click">
                            <Icon name="reply-all" size={20} alt={c('Title').t`Reply all`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded}
                        className=" pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                    >
                        <Tooltip title={titleForward} className="flex increase-surface-click">
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
