import { OpenPGPKey } from 'pmcrypto';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import {
    classnames,
    Icon,
    Group,
    useToggle,
    useContactEmails,
    useContactGroups,
    useFolders,
    ButtonGroup as OriginalButtonGroup,
    Tooltip
} from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { MailSettings } from 'proton-shared/lib/interfaces';

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
import HeaderRecipientsSimple from './HeaderRecipientsSimple';
import HeaderRecipientsDetails from './HeaderRecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import HeaderDropdown from './HeaderDropdown';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import HeaderExpandedDetails from './HeaderExpandedDetails';
import HeaderRecipientType from './HeaderRecipientType';
import HeaderRecipientItem from './HeaderRecipientItem';
import { OnCompose } from '../../../hooks/useCompose';
import { Breakpoints } from '../../../models/utils';

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
    onTrustSigningKey: (key: OpenPGPKey) => void;
    onTrustAttachedKey: (key: OpenPGPKey) => void;
    onResignContact: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCollapse: () => void;
    onBack: () => void;
    onCompose: OnCompose;
    onSourceMode: (sourceMode: boolean) => void;
    breakpoints: Breakpoints;
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
    onTrustSigningKey,
    onTrustAttachedKey,
    onResignContact,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    onCollapse,
    onBack,
    onCompose,
    onSourceMode,
    breakpoints
}: Props) => {
    const [contacts = []] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = []] = useContactGroups();
    const [folders = []] = useFolders();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const selectedIDs = [message.data?.ID || ''];
    const currentFolderID = getCurrentFolderID(message.data?.LabelIDs, folders);

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
            referenceMessage: message
        });
    };

    const from = (
        <HeaderRecipientItem
            recipientOrGroup={{ recipient: message.data?.Sender }}
            message={message}
            globalIcon={messageViewIcons.globalIcon}
            contacts={contacts}
            onCompose={onCompose}
            isLoading={!messageLoaded}
        />
    );

    const isNarrow = breakpoints.isNarrow;

    return (
        <div
            className={classnames([
                'message-header message-header-expanded',
                showDetails && 'message-header--showDetails',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                !messageLoaded && 'is-loading'
            ])}
        >
            <div className="flex flex-nowrap flex-items-center cursor-pointer" onClick={handleClick}>
                <span className="flex flex-item-fluid">
                    {showDetails ? (
                        <HeaderRecipientType label={c('Label').t`From:`} className="flex flex-nowrap pr0-5">
                            {from}
                        </HeaderRecipientType>
                    ) : (
                        <div className="flex-item-fluid flex flex-nowrap pr0-5">{from}</div>
                    )}
                </span>
                <div className="flex flex-items-center flex-item-noshrink">
                    {messageLoaded && !showDetails && (
                        <>
                            <span className="ml0-5 inline-flex is-appearing-content">
                                <ItemLocation message={message.data} mailSettings={mailSettings} />
                            </span>
                            <ItemDate className="ml0-5 is-appearing-content" element={message.data} labelID={labelID} />
                        </>
                    )}
                    {!messageLoaded && <span className="message-header-metas ml0-5 inline-flex"></span>}
                    {showDetails && (
                        <span className="ml0-5 inline-flex is-appearing-content">
                            <ItemLocation message={message.data} mailSettings={mailSettings} />
                        </span>
                    )}
                    <span className="message-header-star ml0-5 inline-flex">
                        <ItemStar element={message.data} />
                    </span>
                </div>
            </div>
            <div
                className={classnames([
                    'flex flex-nowrap flex-items-start mb0-5 onmobile-flex-wrap',
                    !showDetails && 'mt0-5'
                ])}
            >
                <div className="flex-item-fluid flex flex-nowrap onmobile-flex-wrap pr1 message-header-recipients">
                    {showDetails ? (
                        <HeaderRecipientsDetails
                            message={message}
                            mapStatusIcons={messageViewIcons.mapStatusIcon}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            onCompose={onCompose}
                            isLoading={!messageLoaded}
                        />
                    ) : (
                        <HeaderRecipientsSimple
                            message={message.data}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            isLoading={!messageLoaded}
                        />
                    )}
                    <span className="message-show-hide-link-container onmobile-w100 flex-item-noshrink">
                        {messageLoaded && (
                            <button
                                type="button"
                                onClick={toggleDetails}
                                className="message-show-hide-link pm-button--link alignleft alignbaseline is-appearing-content"
                                disabled={!messageLoaded}
                            >
                                {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                            </button>
                        )}
                    </span>
                </div>
                {messageLoaded && !showDetails && (
                    <>
                        <div className="flex-item-noshrink flex flex-items-center onmobile-w100 onmobile-pt0-25 onmobile-pb0-25 message-header-expanded-label-container is-appearing-content">
                            <ItemLabels
                                element={message.data}
                                labels={labels}
                                showUnlabel
                                maxNumber={5}
                                className="onmobile-pt0-25"
                            />
                        </div>
                        <div className="flex-item-noshrink mauto flex onmobile-mt0-25">
                            <ItemAttachmentIcon element={message.data} className="ml0-5" />
                        </div>
                    </>
                )}
            </div>

            {showDetails && (
                <HeaderExpandedDetails
                    labelID={labelID}
                    message={message}
                    messageViewIcons={messageViewIcons}
                    labels={labels}
                />
            )}

            <HeaderExtra
                message={message}
                sourceMode={sourceMode}
                onTrustSigningKey={onTrustSigningKey}
                onTrustAttachedKey={onTrustAttachedKey}
                onResignContact={onResignContact}
                messageLoaded={messageLoaded}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
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
                                className="pm-button pm-group-button pm-button--for-icon"
                                dropDownClassName="customFilterDropdown"
                                title={c('Action').t`Filter on`}
                                loading={!messageLoaded}
                            >
                                {({ onClose }) => (
                                    <CustomFilterDropdown message={message.data as Message} onClose={onClose} />
                                )}
                            </HeaderDropdown>
                            <HeaderDropdown
                                autoClose={false}
                                noMaxSize={true}
                                content={<Icon name="folder" alt={c('Action').t`Move to`} />}
                                className="pm-button pm-group-button pm-button--for-icon"
                                dropDownClassName="moveDropdown"
                                title={c('Action').t`Move to`}
                                loading={!messageLoaded}
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
                                noMaxSize={true}
                                content={<Icon name="label" alt={c('Action').t`Label as`} />}
                                className="pm-button pm-group-button pm-button--for-icon"
                                dropDownClassName="labelDropdown"
                                title={c('Action').t`Label as`}
                                loading={!messageLoaded}
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
                        <Tooltip title={c('Title').t`Reply`} className="flex increase-surface-click">
                            <Icon name="reply" size={20} alt={c('Title').t`Reply`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded}
                        className="pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                    >
                        <Tooltip title={c('Title').t`Reply all`} className="flex increase-surface-click">
                            <Icon name="reply-all" size={20} alt={c('Title').t`Reply all`} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded || !bodyLoaded}
                        className=" pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                    >
                        <Tooltip title={c('Title').t`Forward`} className="flex increase-surface-click">
                            <Icon name="forward" size={20} alt={c('Title').t`Forward`} />
                        </Tooltip>
                    </ButtonGroup>
                </Group>
            </div>
            {/*{messageLoaded ? <HeaderAttachmentEvent message={message} /> : null}*/}
        </div>
    );
};

export default HeaderExpanded;
