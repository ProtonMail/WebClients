import React from 'react';
import { c, msgid } from 'ttag';
import { Icon, useApi, useEventManager, useFolders } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { unlabelMessages } from 'proton-shared/lib/api/messages';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings } from 'proton-shared/lib/interfaces';

import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import { isCustomLabel, getCurrentFolders } from '../../../helpers/labels';
import { getNumAttachmentByType } from '../../../helpers/message/messages';
import { getSize, getLabelIDs } from '../../../helpers/elements';
import { MessageViewIcons } from '../../../helpers/message/icon';

interface Props {
    labelID: string;
    labels?: Label[];
    mailSettings: MailSettings;
    message: MessageExtended;
    messageViewIcons: MessageViewIcons;
}

const HeaderExpandedDetails = ({ labelID, labels, message, messageViewIcons, mailSettings }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [customFolders = []] = useFolders();

    const handleRemoveLabel = async (labelID: string) => {
        await api(unlabelMessages({ LabelID: labelID, IDs: [message.data?.ID] }));
        await call();
    };

    const icon = messageViewIcons.globalIcon;

    const folders = getCurrentFolders(message.data, customFolders, mailSettings);
    const locationText = folders.map((folder) => folder.name).join(', ');

    const sizeText = humanSize(getSize(message.data || {}));

    const [numPureAttachments, numEmbedded] = getNumAttachmentByType(message);
    const attachmentsTexts = [];
    numPureAttachments &&
        attachmentsTexts.push(
            c('Info').ngettext(msgid`${numPureAttachments} file`, `${numPureAttachments} files`, numPureAttachments)
        );
    numEmbedded &&
        attachmentsTexts.push(
            c('Info').ngettext(msgid`${numEmbedded} embedded image`, `${numEmbedded} embedded images`, numEmbedded)
        );
    const attachmentsText = attachmentsTexts.join(', ');

    const labelIDs = (getLabelIDs(message.data || {}) || []).filter((labelID) => isCustomLabel(labelID, labels));

    return (
        <div className="message-detailed-header-extra border-top pt0-5">
            {icon && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to flex">
                        <Icon name="info" className="mauto" alt={c('Label').t`Encryption:`} />
                    </span>
                    <span className="flex-self-vcenter mr0-5 ellipsis">{icon.text}</span>
                </div>
            )}
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <Icon name="calendar" className="mauto" alt={c('Label').t`Date:`} />
                </span>
                <span className="flex-self-vcenter mr0-5 ellipsis">
                    <ItemDate element={message.data} labelID={labelID} mode="full" />
                </span>
            </div>
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <span className="mauto flex">
                        <ItemLocation message={message.data} mailSettings={mailSettings} />
                    </span>
                </span>
                <span className="flex-self-vcenter mr0-5 ellipsis">{locationText}</span>
            </div>
            <div className="mb0-5 flex flex-nowrap">
                <span className="container-to flex">
                    <Icon name="user-storage" className="mauto" alt={c('Label').t`Size:`} />
                </span>
                <span className="flex-self-vcenter mr0-5 ellipsis">{sizeText}</span>
            </div>
            {attachmentsText && (
                <div className="mb0-5 flex flex-nowrap">
                    <span className="container-to flex">
                        <span className="mauto flex">
                            <ItemAttachmentIcon element={message.data} />
                        </span>
                    </span>
                    <span className="flex-self-vcenter mr0-5 ellipsis">{attachmentsText}</span>
                </div>
            )}
            {labelIDs.length > 0 && (
                <div className="flex flex-nowrap">
                    <span className="container-to flex pb0-25">
                        <Icon name="label" className="mauto" alt={c('Label').t`Labels:`} />
                    </span>
                    <span className="flex-self-vcenter mr0-5 ellipsis pm-badgeLabel-container--groupMayWrap">
                        <ItemLabels
                            max={4}
                            isCollapsed={false}
                            element={message.data}
                            labels={labels}
                            onUnlabel={handleRemoveLabel}
                        />
                    </span>
                </div>
            )}
        </div>
    );
};

export default HeaderExpandedDetails;
