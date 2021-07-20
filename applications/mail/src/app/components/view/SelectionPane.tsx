import React, { useMemo } from 'react';
import { Button, useLabels, useFolders } from '@proton/components';
import { c, msgid } from 'ttag';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Location } from 'history';

import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import conversationSvg from '@proton/styles/assets/img/placeholders/selected-emails.svg';

import { getLabelName, isCustomLabel as testIsCustomLabel } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';

interface Props {
    labelID: string;
    mailSettings: MailSettings | undefined;
    location: Location;
    labelCount: LabelCount | undefined;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const SelectionPane = ({ labelID, mailSettings, location, labelCount, checkedIDs = [], onCheckAll }: Props) => {
    const conversationMode = isConversationMode(labelID, mailSettings, location);

    const [labels] = useLabels();
    const [folders] = useFolders();

    const isCustomLabel = testIsCustomLabel(labelID, labels);
    const total = labelCount?.Total || 0;
    const checkeds = checkedIDs.length;

    const labelName = useMemo(() => getLabelName(labelID, labels, folders), [labelID, labels, folders]);

    const count = checkeds || total;

    const countOfConversationOrMessage = conversationMode ? (
        <strong key="conversation">
            {c('Info').ngettext(msgid`${count} conversation`, `${count} conversations`, count)}
        </strong>
    ) : (
        <strong key="email">{c('Info').ngettext(msgid`${count} message`, `${count} messages`, count)}</strong>
    );

    // Need to have 2 similar strings for each case, in order to translate them correctly depending on message and conversation gender
    const getFolderText = () => {
        if (checkeds) {
            // translator: the variable is an HTML tag containing the number of conversations selected, already formatted in plural form - ex: 1 conversation, 2 conversations
            return conversationMode
                ? c('Info').jt`You selected ${countOfConversationOrMessage} from this folder`
                : // translator: the variable is an HTML tag containing the number of messages selected, already formatted in plural form - ex: 1 message, 2 messages
                  c('Info').jt`You selected ${countOfConversationOrMessage} from this folder`;
        }
        // translator: the variable is an HTML tag containing the number of conversations stored, already formatted in plural form - ex: 1 conversation, 2 conversations
        return conversationMode
            ? c('Info').jt`You have ${countOfConversationOrMessage} stored in this folder`
            : // translator: the variable is an HTML tag containing the number of conversations stored, already formatted in plural form - ex: 1 message, 2 messages
              c('Info').jt`You have ${countOfConversationOrMessage} stored in this folder`;
    };

    // Need to have 2 similar strings for each case, in order to translate them correctly depending on message and conversation gender
    const getLabelText = () => {
        if (checkeds) {
            // translator: the variable is an HTML tag containing the number of conversations selected, already formatted in plural form - ex: 1 conversation, 2 conversations
            return conversationMode
                ? c('Info').jt`You selected ${countOfConversationOrMessage}  with this label`
                : // translator: the variable is an HTML tag containing the number of messages selected, already formatted in plural form - ex: 1 message, 2 messages
                  c('Info').jt`You selected ${countOfConversationOrMessage}  with this label`;
        }
        // translator: the variable is an HTML tag containing the number of conversations tagged, already formatted in plural form - ex: 1 conversation, 2 conversations
        return conversationMode
            ? c('Info').jt`You have ${countOfConversationOrMessage} tagged with this label`
            : // translator: the variable is an HTML tag containing the number of messages tagged, already formatted in plural form - ex: 1 message, 2 messages
              c('Info').jt`You have ${countOfConversationOrMessage} tagged with this label`;
    };

    const text = isCustomLabel ? getLabelText() : getFolderText();

    const showText = checkeds || labelCount;

    return (
        <div className="mauto text-center p2 max-w100">
            {checkeds === 0 && labelName && (
                <h3 className="text-bold lh-rg text-ellipsis" title={labelName}>
                    {labelName}
                </h3>
            )}
            <p className="mb2 text-keep-space">{showText ? text : null}</p>
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
