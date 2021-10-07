import { c, msgid } from 'ttag';
import { Icon, useFolders } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import { MessageExtended } from '../../../models/message';
import { getCurrentFolders, isCustomLabel } from '../../../helpers/labels';
import { getAttachmentCounts } from '../../../helpers/message/messages';
import { getSize } from '../../../helpers/elements';
import { MessageViewIcons } from '../../../helpers/message/icon';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import ItemLocation from '../../list/ItemLocation';
import SpyTrackerIcon from '../SpyTrackerIcon';
import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';

interface Props {
    labelID: string;
    labels?: Label[];
    mailSettings: MailSettings;
    message: MessageExtended;
    messageViewIcons: MessageViewIcons;
}

const HeaderExpandedDetails = ({ labelID, labels, message, messageViewIcons, mailSettings }: Props) => {
    const icon = messageViewIcons.globalIcon;

    const [customFolders = []] = useFolders();
    const folders = getCurrentFolders(message.data, labelID, customFolders, mailSettings);
    const locationText = folders.map((folder) => folder.name).join(', ');

    const sizeText = humanSize(getSize(message.data || {}));

    const { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title } = useMessageTrackers({
        message,
        isDetails: true,
    });
    const displayTrackerIcon = !(!hasProtection && hasShowImage && numberOfTrackers === 0);

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
    if (embeddedAttachmentsCount) {
        attachmentsTexts.push(
            c('Info').ngettext(
                msgid`${embeddedAttachmentsCount} embedded image`,
                `${embeddedAttachmentsCount} embedded images`,
                embeddedAttachmentsCount
            )
        );
    }
    const attachmentsText = attachmentsTexts.join(', ');

    const labelIDs = (message.data?.LabelIDs || []).filter((labelID) => isCustomLabel(labelID, labels));

    return (
        <div
            className="message-detailed-header-extra border-top pt0-5"
            data-testid="message:message-expanded-header-extra"
        >
            {icon && (
                <div className="mb0-5 flex flex-nowrap flex-align-items-center">
                    <span className="container-to flex flex-justify-center">
                        <EncryptionStatusIcon useTooltip={false} {...icon} />
                    </span>
                    <span className="text-ellipsis" title={icon.text}>
                        {icon.text}
                    </span>
                </div>
            )}
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <Icon name="calendar-days" className="mauto" alt={c('Label').t`Date:`} />
                </span>
                <span className="flex-align-self-center mr0-5 text-ellipsis">
                    <ItemDate element={message.data} labelID={labelID} mode="full" />
                </span>
            </div>
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <span className="mauto flex">
                        <ItemLocation
                            element={message.data}
                            labelID={labelID}
                            shouldStack
                            showTooltip={false}
                            withDefaultMargin={false}
                        />
                    </span>
                </span>
                <span className="flex-align-self-center mr0-5 text-ellipsis" title={locationText}>
                    {locationText}
                </span>
            </div>
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <Icon name="filing-cabinet" className="mauto" alt={c('Label').t`Size:`} />
                </span>
                <span className="flex-align-self-center mr0-5 text-ellipsis" title={sizeText}>
                    {sizeText}
                </span>
            </div>
            {attachmentsText && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to flex">
                        <Icon name="paperclip" className="mauto" alt={c('Alt').t`Has attachments`} />
                    </span>
                    <span className="flex-align-self-center mr0-5 text-ellipsis" title={attachmentsText}>
                        {attachmentsText}
                    </span>
                </div>
            )}
            {displayTrackerIcon && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to relative inline-flex item-spy-tracker-link flex-align-items-center">
                        <SpyTrackerIcon
                            numberOfTrackers={numberOfTrackers}
                            needsMoreProtection={needsMoreProtection}
                            title={title}
                            className="mauto"
                            isDetails
                        />
                    </span>
                    <span className="flex-align-self-center mr0-5 text-ellipsis" title={title}>
                        {title}
                    </span>
                </div>
            )}
            {labelIDs.length > 0 && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to flex">
                        <Icon name="tag" className="mauto" alt={c('Label').t`Labels:`} />
                    </span>
                    <ItemLabels
                        isCollapsed={false}
                        element={message.data}
                        labelID={labelID}
                        labels={labels}
                        showUnlabel
                    />
                </div>
            )}
        </div>
    );
};

export default HeaderExpandedDetails;
