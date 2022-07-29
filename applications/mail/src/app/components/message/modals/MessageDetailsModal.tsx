import { c, msgid } from 'ttag';

import {
    Button,
    FeatureCode,
    Icon,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFeatures,
    useFolders,
} from '@proton/components';
import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { getSize } from '../../../helpers/elements';
import { getCurrentFolders } from '../../../helpers/labels';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { getAttachmentCounts } from '../../../helpers/message/messages';
import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { Element } from '../../../models/element';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ItemDate from '../../list/ItemDate';
import ItemLocation from '../../list/ItemLocation';
import SpyTrackerIcon from '../../list/spy-tracker/SpyTrackerIcon';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import RecipientItem from '../recipients/RecipientItem';
import RecipientsDetails from '../recipients/RecipientsDetails';

interface Props extends ModalProps {
    labelID: string;
    message: MessageState;
    messageViewIcons: MessageViewIcons;
    mailSettings: MailSettings;
    messageLoaded: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const MessageDetailsModal = ({
    labelID,
    message,
    messageViewIcons,
    mailSettings,
    messageLoaded,
    onContactDetails,
    onContactEdit,
    ...rest
}: Props) => {
    const [{ feature: spyTrackerFeature }, { feature: numAttachmentsWithoutEmbeddedFeature }] = useFeatures([
        FeatureCode.SpyTrackerProtection,
        FeatureCode.NumAttachmentsWithoutEmbedded,
    ]);

    const { onClose } = rest;

    const icon = messageViewIcons.globalIcon;

    const [customFolders = []] = useFolders();
    const folders = getCurrentFolders(message.data, labelID, customFolders, mailSettings);
    const locationText = folders.map((folder) => folder.name).join(', ');

    const sizeText = humanSize(getSize(message.data || ({} as Element)));

    const { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title } = useMessageTrackers({
        message,
        isDetails: true,
    });
    const displayTrackerIcon = !(!hasProtection && hasShowImage && numberOfTrackers === 0) && spyTrackerFeature?.Value;

    const { pureAttachmentsCount, embeddedAttachmentsCount } = getAttachmentCounts(
        getAttachments(message.data),
        message.messageImages
    );
    const attachmentsTexts = [];
    if (pureAttachmentsCount) {
        attachmentsTexts.push(
            c('Info').ngettext(
                msgid`${pureAttachmentsCount} file attached`,
                `${pureAttachmentsCount} files attached`,
                pureAttachmentsCount
            )
        );
    }
    if (embeddedAttachmentsCount && !numAttachmentsWithoutEmbeddedFeature?.Value) {
        attachmentsTexts.push(
            c('Info').ngettext(
                msgid`${embeddedAttachmentsCount} embedded image`,
                `${embeddedAttachmentsCount} embedded images`,
                embeddedAttachmentsCount
            )
        );
    }
    const attachmentsText = attachmentsTexts.join(', ');

    const showAttachmentsDetails = numAttachmentsWithoutEmbeddedFeature?.Value
        ? pureAttachmentsCount > 0
        : attachmentsText;

    const sender = message.data?.Sender;

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Message details`} />
            <ModalTwoContent>
                <div
                    className="message-detailed-header-extra pt0-5 mb2"
                    data-testid="message:message-expanded-header-extra"
                >
                    {icon && (
                        <div className="mb0-5 flex flex-nowrap flex-align-items-center">
                            <span className="mr0-5 flex">
                                <EncryptionStatusIcon useTooltip={false} isDetailsModal {...icon} />
                            </span>
                            <span className="pl0-25 flex-item-fluid text-ellipsis" title={icon.text}>
                                {icon.text}
                            </span>
                        </div>
                    )}
                    {displayTrackerIcon && (
                        <div className="mb0-5 flex flex-nowrap flex-align-items-center">
                            <span className="mr0-5 relative inline-flex item-spy-tracker-link flex-align-items-center">
                                <SpyTrackerIcon
                                    numberOfTrackers={numberOfTrackers}
                                    needsMoreProtection={needsMoreProtection}
                                    title={title}
                                    isDetailsModal
                                    className="mauto"
                                />
                            </span>
                            <span className="pl0-25 flex-item-fluid text-ellipsis" title={title}>
                                {title}
                            </span>
                        </div>
                    )}
                    <div className="mb0-5 flex flex-nowrap">
                        <span className="mr0-5 flex">
                            <Icon name="calendar-grid" className="mauto" alt={c('Label').t`Date:`} />
                        </span>
                        <span className="pl0-25 flex-item-fluid text-ellipsis">
                            <ItemDate element={message.data} labelID={labelID} mode="full" />
                        </span>
                    </div>
                    <div className="mb0-5 flex flex-nowrap">
                        <span className="mr0-5 flex">
                            <span className="mauto flex">
                                <ItemLocation
                                    element={message.data}
                                    labelID={labelID}
                                    shouldStack
                                    showTooltip={false}
                                    withDefaultMargin={false}
                                    ignoreIconFilter
                                />
                            </span>
                        </span>
                        <span className="pl0-25 flex-item-fluid text-ellipsis" title={locationText}>
                            {locationText}
                        </span>
                    </div>
                    <div className="mb0-5 flex flex-nowrap">
                        <span className="mr0-5 flex">
                            <Icon name="filing-cabinet" className="mauto" alt={c('Label').t`Size:`} />
                        </span>
                        <span className="pl0-25 flex-item-fluid text-ellipsis" title={sizeText}>
                            {sizeText}
                        </span>
                    </div>
                    {showAttachmentsDetails && (
                        <div className="mb0-5 flex flex-nowrap">
                            <span className="mr0-5 flex">
                                <span className="mauto flex">
                                    <ItemAttachmentIcon element={message.data} />
                                </span>
                            </span>
                            <span className="pl0-25 flex-item-fluid text-ellipsis" title={attachmentsText}>
                                {attachmentsText}
                            </span>
                        </div>
                    )}
                </div>
                {sender && (
                    <div className="mb1">
                        <div className="mb0-5">
                            <strong>{c('Title').t`Sender`}</strong>
                        </div>
                        <RecipientItem
                            recipientOrGroup={{ recipient: sender }}
                            isLoading={!messageLoaded}
                            onContactDetails={onContactDetails}
                            onContactEdit={onContactEdit}
                        />
                    </div>
                )}
                <div className="message-detail-modal-container">
                    <RecipientsDetails
                        message={message}
                        isLoading={!messageLoaded}
                        isDetailsModal={true}
                        onContactDetails={onContactDetails}
                        onContactEdit={onContactEdit}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="mlauto" color="norm" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default MessageDetailsModal;
