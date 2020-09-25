import React from 'react';
import { c, msgid } from 'ttag';
import { Icon } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import { MessageExtended } from '../../../models/message';
import { isCustomLabel } from '../../../helpers/labels';
import { getNumAttachmentByType } from '../../../helpers/message/messages';
import { getSize, getLabelIDs } from '../../../helpers/elements';
import { MessageViewIcons } from '../../../helpers/message/icon';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageExtended;
    messageViewIcons: MessageViewIcons;
}

const HeaderExpandedDetails = ({ labelID, labels, message }: Props) => {
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

    const labelIDs = (getLabelIDs(message.data || {}) || []).filter((labelID) => isCustomLabel(labelID, labels));

    return (
        <div className="message-detailed-header-extra border-top pt0-5 pb0-5 is-appearing-content">
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
                    <Icon name="user-storage" className="mauto" alt={c('Label').t`Size:`} />
                </span>
                <span className="flex-self-vcenter mr0-5 ellipsis">{sizeText}</span>
            </div>
            {labelIDs.length > 0 && (
                <div className="flex flex-nowrap">
                    <span className="container-to flex">
                        <Icon name="label" className="mauto" alt={c('Label').t`Labels:`} />
                    </span>
                    <ItemLabels isCollapsed={false} element={message.data} labels={labels} showUnlabel />
                </div>
            )}
        </div>
    );
};

export default HeaderExpandedDetails;
