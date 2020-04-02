import React, { useMemo } from 'react';
import { Button, useLabels, useFolders } from 'react-components';
import { c, ngettext, msgid } from 'ttag';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Location } from 'history';

import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import conversationSingleSvgLight from 'design-system/assets/img/shared/selected-conversation-single.svg';
import conversationSingleSvgDark from 'design-system/assets/img/shared/selected-conversation-single-dark.svg';
import conversationManySvgLight from 'design-system/assets/img/shared/selected-conversation-many.svg';
import conversationManySvgDark from 'design-system/assets/img/shared/selected-conversation-many-dark.svg';

import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    location: Location;
    labelCount: LabelCount;
    checkedIDs?: string[];
    onUncheckAll: () => void;
}

const SelectionPane = ({ labelID, mailSettings, location, labelCount, checkedIDs = [], onUncheckAll }: Props) => {
    const conversationMode = isConversationMode(labelID, mailSettings, location);

    const [labels] = useLabels();
    const [folders] = useFolders();

    const total = labelCount.Total || 0;
    const checkeds = checkedIDs.length;
    const conversationSingleSvg = getLightOrDark(conversationSingleSvgLight, conversationSingleSvgDark);
    const conversationManySvg = getLightOrDark(conversationManySvgLight, conversationManySvgDark);

    const labelName = useMemo(() => getLabelName(labelCount.LabelID || '', labels, folders), [
        labels,
        folders,
        labelCount
    ]);

    const count = checkeds ? checkeds : total;

    const strongText = conversationMode ? (
        <strong key="conversation">{ngettext(msgid`${count} conversation`, `${count} conversations`, count)}</strong>
    ) : (
        <strong key="email">{ngettext(msgid`${count} email`, `${count} emails`, count)}</strong>
    );

    const text = checkeds
        ? c('Info').jt`You selected ${strongText} from this folder`
        : c('Info').jt`You have ${strongText} stored in this folder`;

    return (
        <div className="flex-item-fluid aligncenter p2">
            {checkeds === 0 && labelName && <h3 className="bold">{labelName}</h3>}
            <p className="mb2">{text}</p>
            <div className="mb2">
                <img
                    src={checkeds > 1 ? conversationManySvg : conversationSingleSvg}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                />
            </div>
            {checkeds > 0 && <Button onClick={onUncheckAll}>{c('Action').t`Deselect`}</Button>}
        </div>
    );
};

export default SelectionPane;
