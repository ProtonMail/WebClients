import { OpenPGPKey } from 'pmcrypto';
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
import { MessageExtended, Message } from '../../../models/message';
import HeaderDropdown from './HeaderDropdown';
import HeaderMoreDropdown from './HeaderMoreDropdown';
import HeaderExpandedDetails from './HeaderExpandedDetails';
import HeaderRecipientType from './HeaderRecipientType';
import HeaderRecipientItem from './HeaderRecipientItem';
import ItemAction from '../../list/ItemAction';
import { OnCompose } from '../../../hooks/useCompose';

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
}

const HeaderExpanded = ({
    labelID,
    conversationMode,
    labels,
    message,
    messageViewIcons,
    isSentMessage,
    messageLoaded,
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
    onSourceMode
}: Props) => {
    const [contacts = []] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = []] = useContactGroups();
    const [folders = []] = useFolders();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const elements = [message.data || {}];
    const currentFolderID = getCurrentFolderID(message.data?.LabelIDs, folders);

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation') || window.getSelection()?.toString().length) {
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
            globalIcon={messageViewIcons.globalIcon}
            contacts={contacts}
            onCompose={onCompose}
        />
    );

    return (
        <div
            className={classnames([
                'message-header message-header-expanded',
                showDetails && 'message-header--showDetails',
                isSentMessage ? 'is-outbound' : 'is-inbound'
            ])}
        >
            <div className="flex flex-nowrap flex-items-center cursor-pointer" onClick={handleClick}>
                <span className="flex flex-item-fluid">
                    {showDetails ? (
                        <HeaderRecipientType label={c('Label').t`From:`} className="flex flex-nowrap pr0-5">
                            {from}
                        </HeaderRecipientType>
                    ) : (
                        <div className="flex flex-nowrap pr0-5">{from}</div>
                    )}
                    <ItemAction element={message.data} className="mtauto mbauto" />
                </span>
                <div className="flex-item-noshrink flex">
                    {showDetails ? null : (
                        <>
                            <span className="ml0-5 inline-flex">
                                <ItemLocation message={message.data} mailSettings={mailSettings} />
                            </span>
                            <ItemDate className="ml0-5" element={message.data} labelID={labelID} />
                        </>
                    )}
                    <span className="ml0-5 inline-flex">
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
                <div className="flex-item-fluid flex flex-nowrap pr1 message-header-recipients">
                    {showDetails ? (
                        <HeaderRecipientsDetails
                            message={message.data}
                            mapStatusIcons={messageViewIcons.mapStatusIcon}
                            contacts={contacts}
                            contactGroups={contactGroups}
                            onCompose={onCompose}
                        />
                    ) : (
                        <HeaderRecipientsSimple
                            message={message.data}
                            contacts={contacts}
                            contactGroups={contactGroups}
                        />
                    )}
                    <a onClick={toggleDetails} className="bold message-show-hide-link flex-item-noshrink">
                        {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                    </a>
                </div>
                {!showDetails && (
                    <div className="flex-item-noshrink onmobile-w100 onmobile-mt0-5 message-header-expanded-label-container">
                        <ItemAttachmentIcon element={message.data} />
                        <ItemLabels max={4} element={message.data} labels={labels} showUnlabel />
                    </div>
                )}
            </div>

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
                onTrustSigningKey={onTrustSigningKey}
                onTrustAttachedKey={onTrustAttachedKey}
                onResignContact={onResignContact}
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
                    />

                    <Group className="mr1 mb0-5">
                        <HeaderDropdown
                            autoClose={false}
                            content={<Icon name="filter" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="customFilterDropdown"
                            title={c('Action').t`Custom filter`}
                        >
                            {() => <CustomFilterDropdown message={message.data as Message} />}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            noMaxSize={true}
                            content={<Icon name="folder" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="moveDropdown"
                            title={c('Action').t`Move to`}
                        >
                            {({ onClose, onLock }) => (
                                <MoveDropdown
                                    labelID={currentFolderID}
                                    elements={elements}
                                    conversationMode={conversationMode}
                                    onClose={onClose}
                                    onLock={onLock}
                                    onBack={onBack}
                                />
                            )}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            noMaxSize={true}
                            content={<Icon name="label" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="labelDropdown"
                            title={c('Action').t`Label as`}
                        >
                            {({ onClose, onLock }) => (
                                <LabelDropdown
                                    labelID={labelID}
                                    labels={labels}
                                    elements={elements}
                                    onClose={onClose}
                                    onLock={onLock}
                                />
                            )}
                        </HeaderDropdown>
                    </Group>
                </div>

                <Group className="mb0-5">
                    <ButtonGroup
                        disabled={!messageLoaded}
                        className="pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                    >
                        <Tooltip title={c('Title').t`Reply`} className="flex increase-surface-click">
                            <Icon name="reply" size={20} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded}
                        className="pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                    >
                        <Tooltip title={c('Title').t`Reply all`} className="flex increase-surface-click">
                            <Icon name="reply-all" size={20} />
                        </Tooltip>
                    </ButtonGroup>
                    <ButtonGroup
                        disabled={!messageLoaded}
                        className=" pm-button--for-icon pm-button--primary flex flex-items-center relative"
                        onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                    >
                        <Tooltip title={c('Title').t`Forward`} className="flex increase-surface-click">
                            <Icon name="forward" size={20} />
                        </Tooltip>
                    </ButtonGroup>
                </Group>
            </div>
        </div>
    );
};

export default HeaderExpanded;
