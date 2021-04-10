import React, { useMemo } from 'react';
import { Button, useLabels, useFolders } from 'react-components';
import { c, msgid } from 'ttag';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Location } from 'history';

import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import conversationSvg from 'design-system/assets/img/placeholders/selected-emails.svg';

import { getLabelName, isCustomLabel as testIsCustomLabel } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    location: Location;
    labelCount: LabelCount;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const SelectionPane = ({ labelID, mailSettings, location, labelCount, checkedIDs = [], onCheckAll }: Props) => {
    const conversationMode = isConversationMode(labelID, mailSettings, location);

    const [labels] = useLabels();
    const [folders] = useFolders();

    const isCustomLabel = testIsCustomLabel(labelID, labels);
    const total = labelCount.Total || 0;
    const checkeds = checkedIDs.length;

    const labelName = useMemo(() => getLabelName(labelCount.LabelID || '', labels, folders), [
        labels,
        folders,
        labelCount,
    ]);

    const count = checkeds || total;

    const countOfConversationOrMessage = conversationMode ? (
        <strong key="conversation">
            {c('Info').ngettext(msgid`${count} conversation`, `${count} conversations`, count)}
        </strong>
    ) : (
        <strong key="email">{c('Info').ngettext(msgid`${count} message`, `${count} messages`, count)}</strong>
    );

    const folderText = checkeds
        ? c('Info').jt`You selected ${countOfConversationOrMessage} from this folder`
        : c('Info').jt`You have ${countOfConversationOrMessage} stored in this folder`;

    const labelText = checkeds
        ? c('Info').jt`You selected ${countOfConversationOrMessage} with this label`
        : c('Info').jt`You have ${countOfConversationOrMessage} tagged with this label`;

    const text = isCustomLabel ? labelText : folderText;

    return (
        <div className="mauto text-center p2 max-w100">
            {checkeds === 0 && labelName && (
                <h3 className="text-bold lh-rg text-ellipsis" title={labelName}>
                    {labelName}
                </h3>
            )}
            <p className="mb2">{text}</p>
            <div className="mb2">
                <img
                    src={conversationSvg}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                    className="hauto"
                />
            </div>
            {checkeds > 0 && <Button onClick={() => onCheckAll(false)}>{c('Action').t`Deselect`}</Button>}
        </div>
    );
};

export default SelectionPane;
