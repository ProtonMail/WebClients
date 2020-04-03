import React, { MouseEvent, useMemo } from 'react';
import { c } from 'ttag';
import {
    Icon,
    Group,
    ButtonGroup,
    useToggle,
    useContactEmails,
    useContactGroups,
    useApi,
    useEventManager
} from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { unlabelMessages } from 'proton-shared/lib/api/messages';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import { MESSAGE_ACTIONS } from '../../../constants';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import MoveDropdown from '../../dropdown/MoveDropdown';
import LabelDropdown from '../../dropdown/LabelDropdown';
import CustomFilterDropdown from '../../dropdown/CustomFilterDropdown';
import HeaderExtra from './HeaderExtra';
import MessageLock from '../MessageLock';
import { isSent } from '../../../helpers/message/messages';
import HeaderRecipientsSimple from './HeaderRecipientsSimple';
import HeaderRecipientsDetails from './HeaderRecipientsDetails';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import HeaderDropdown from './HeaderDropdown';
import { OnCompose } from '../../../containers/ComposerContainer';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';

import './MessageHeader.scss';

interface Props {
    labels?: Label[];
    mailSettings: any;
    message: MessageExtended;
    messageLoaded: boolean;
    onLoadRemoteImages: () => void;
    onLoadEmbeddedImages: () => void;
    onCollapse: () => void;
    onCompose: OnCompose;
}

const HeaderExpanded = ({
    labels,
    message,
    messageLoaded,
    onLoadRemoteImages,
    onLoadEmbeddedImages,
    mailSettings,
    onCollapse,
    onCompose
}: Props) => {
    const [contacts = []] = useContactEmails() as [ContactEmail[] | undefined, boolean, Error];
    const [contactGroups = []] = useContactGroups();
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const api = useApi();
    const { call } = useEventManager();

    const { Name, Address } = (message.data || {}).Sender || {};
    const inOutClass = isSent(message.data) ? 'is-outbound' : 'is-inbound';

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

    const elements = useMemo(() => [message.data || {}], [message]);

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
                <div>
                    <span className="mr0-5">{c('Label').t`From:`}</span>
                    <span className="bold mr0-5" title={Name}>
                        {Name}
                    </span>
                    <i title={Address}>&lt;{Address}&gt;</i>
                    <MessageLock message={message} className="stop-propagation" />
                </div>
                <div>
                    <ItemDate element={message.data || {}} />
                </div>
            </div>
            <div className="flex flex-nowrap flex-items-start flex-spacebetween ml1 mr1 mb0-5">
                {showDetails ? (
                    <HeaderRecipientsDetails message={message.data} contacts={contacts} contactGroups={contactGroups} />
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
                        >
                            {() => <CustomFilterDropdown message={message.data || {}} />}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            content={<Icon name="folder" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                        >
                            {({ onClose, onLock }) => (
                                <MoveDropdown elements={elements} onClose={onClose} onLock={onLock} />
                            )}
                        </HeaderDropdown>
                        <HeaderDropdown
                            autoClose={false}
                            content={<Icon name="label" />}
                            className="pm-button pm-group-button pm-button--for-icon"
                        >
                            {({ onClose, onLock }) => (
                                <LabelDropdown elements={elements} onClose={onClose} onLock={onLock} />
                            )}
                        </HeaderDropdown>
                    </Group>

                    <Group>
                        <ButtonGroup disabled={!messageLoaded} onClick={handleCompose(MESSAGE_ACTIONS.REPLY)}>
                            <Icon name="reply" />
                        </ButtonGroup>
                        <ButtonGroup disabled={!messageLoaded} onClick={handleCompose(MESSAGE_ACTIONS.REPLY_ALL)}>
                            <Icon name="reply-all" />
                        </ButtonGroup>
                        <ButtonGroup disabled={!messageLoaded} onClick={handleCompose(MESSAGE_ACTIONS.FORWARD)}>
                            <Icon name="forward" />
                        </ButtonGroup>
                    </Group>
                </div>
            </div>
            <HeaderExtra
                message={message}
                onLoadRemoteImages={onLoadRemoteImages}
                onLoadEmbeddedImages={onLoadEmbeddedImages}
            />
        </div>
    );
};

export default HeaderExpanded;
