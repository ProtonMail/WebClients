import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import {
    Icon,
    Group,
    useToggle,
    useContactEmails,
    useContactGroups,
    ButtonGroup as OriginalButtonGroup,
    useApi,
    useEventManager
} from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { unlabelMessages } from 'proton-shared/lib/api/messages';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import { MESSAGE_ACTIONS } from '../../../constants';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import { MessageViewIcons } from '../../../helpers/message/icon';
import HeaderExtra from './HeaderExtra';
import HeaderRecipientsSimple from './HeaderRecipientsSimple';
import HeaderRecipientsDetails from './HeaderRecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import HeaderDropdown from './HeaderDropdown';
import { OnCompose } from '../../../containers/ComposerContainer';

import './MessageHeader.scss';
import HeaderMoreDropdown from './HeaderMoreDropdown';

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
    labels?: Label[];
    mailSettings: any;
    message: MessageExtended;
    messageViewIcons?: MessageViewIcons;
    isSentMessage: boolean;
    messageLoaded: boolean;
    sourceMode: boolean;
    onTrustKey: () => void;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCollapse: () => void;
    onBack: () => void;
    onCompose: OnCompose;
    onSourceMode: (sourceMode: boolean) => void;
}

const HeaderExpanded = ({
    labelID,
    labels,
    message,
    messageViewIcons,
    isSentMessage,
    messageLoaded,
    sourceMode,
    onTrustKey,
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
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const api = useApi();
    const { call } = useEventManager();

    const { Name, Address } = (message.data || {}).Sender || {};
    const elements = [message.data || {}];
    const inOutClass = isSentMessage ? 'is-outbound' : 'is-inbound';
    const icon = messageViewIcons?.globalIcon;

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
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

    const handleRemoveLabel = async (labelID: string) => {
        await api(unlabelMessages({ LabelID: labelID, IDs: [message.data?.ID] }));
        await call();
    };

    return (
        <div className={`message-header message-header-expanded ${inOutClass}`}>
            <div
                className="flex flex-nowrap flex-items-center flex-spacebetween pt1 pl1 pr1 pb0-5 cursor-pointer"
                onClick={handleClick}
            >
                <div className="flex flex-items-center">
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={Name}>
                        {Name}
                    </span>
                    <i title={Address}>&lt;{Address}&gt;</i>
                    {icon && (
                        <span className="flex pl0-25 pr0-25 flex-item-noshrink">
                            <EncryptionStatusIcon {...icon} />
                        </span>
                    )}
                </div>
                <div>
                    <ItemDate element={message.data || {}} />
                </div>
            </div>
            <div className="flex flex-nowrap flex-items-start flex-spacebetween ml1 mr1 mb0-5">
                {showDetails ? (
                    <HeaderRecipientsDetails
                        message={message.data}
                        mapStatusIcons={messageViewIcons?.mapStatusIcon}
                        contacts={contacts}
                        contactGroups={contactGroups}
                    />
                ) : (
                    <HeaderRecipientsSimple message={message.data} contacts={contacts} contactGroups={contactGroups} />
                )}
                <div>
                    <ItemAttachmentIcon element={message.data} />
                    {' ' /* This space is important to keep a small space between elements */}
                    <ItemLabels max={4} element={message.data} labels={labels} onUnlabel={handleRemoveLabel} />
                    {' ' /* This space is important to keep a small space between elements */}
                    <ItemLocation message={message.data} mailSettings={mailSettings} />
                    {' ' /* This space is important to keep a small space between elements */}
                    <ItemStar element={message.data} />
                </div>
            </div>
            {showDetails ? (
                <>
                    <div className="ml1 mr1 mb0-5">
                        <span className="mr0-5">{c('Label').t`Size:`}</span>
                        <span>{humanSize((message.data || {}).Size || 0)}</span>
                    </div>
                    <div className="ml1 mr1 mb0-5">
                        <ItemDate element={message.data || {}} mode="full" />
                    </div>
                </>
            ) : null}
            <div className="flex flex-spacebetween ml1 mr1 mb1 flex-nowrap">
                <a onClick={toggleDetails} className="bold flex-self-vcenter">
                    {showDetails ? c('Action').t`Hide details` : c('Action').t`Show details`}
                </a>
                <div>
                    <Group className="mr1">
                        <HeaderDropdown
                            autoClose={false}
                            content={<Icon name="filter" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="customFilterDropdown"
                        >
                            {() => <CustomFilterDropdown message={message.data || {}} />}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            noMaxSize={true}
                            content={<Icon name="folder" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="moveDropdown"
                        >
                            {({ onClose, onLock }) => (
                                <MoveDropdown labelID={labelID} elements={elements} onClose={onClose} onLock={onLock} />
                            )}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            noMaxSize={true}
                            content={<Icon name="label" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                            dropDownClassName="labelDropdown"
                        >
                            {({ onClose, onLock }) => (
                                <LabelDropdown elements={elements} onClose={onClose} onLock={onLock} />
                            )}
                        </HeaderDropdown>
                        <HeaderDropdown className="pm-button pm-button--for-icon pm-group-button" autoClose={true}>
                            {({ onClose }) => (
                                <HeaderMoreDropdown
                                    message={message}
                                    sourceMode={sourceMode}
                                    onClose={onClose}
                                    onBack={onBack}
                                    onCollapse={onCollapse}
                                    onSourceMode={onSourceMode}
                                />
                            )}
                        </HeaderDropdown>
                    </Group>

                    <Group>
                        <ButtonGroup
                            disabled={!messageLoaded}
                            icon="reply"
                            onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}
                        />
                        <ButtonGroup
                            disabled={!messageLoaded}
                            icon="reply-all"
                            onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}
                        />
                        <ButtonGroup
                            disabled={!messageLoaded}
                            icon="forward"
                            onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}
                        />
                    </Group>
                </div>
            </div>
            <HeaderExtra
                message={message}
                sourceMode={sourceMode}
                onTrustKey={onTrustKey}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />
        </div>
    );
};

export default HeaderExpanded;
