import { useMemo } from 'react';

import { Location } from 'history';
import { c, msgid } from 'ttag';

import { Button, useFolders, useLabels } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import conversationSvg from '@proton/styles/assets/img/illustrations/selected-emails.svg';

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

    /*
     * With ttag we cannot have JSX in plural forms
     * We need a workaround to have the number of messages/conversations in a strong tag
     * So we are surrounding the bold part with ** to replace it later by a strong tag
     */
    const getFolderText = () => {
        if (checkeds) {
            // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
            return conversationMode
                ? c('Info').ngettext(
                      msgid`You selected **${count} conversation** from this folder`,
                      `You selected **${count} conversations** from this folder`,
                      count
                  )
                : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
                  c('Info').ngettext(
                      msgid`You selected **${count} message** from this folder`,
                      `You selected **${count} messages** from this folder`,
                      count
                  );
        }
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You have **${count} conversation** stored in this folder`,
                  `You have **${count} conversations** stored in this folder`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You have **${count} message** stored in this folder`,
                  `You have **${count} messages** stored in this folder`,
                  count
              );
    };

    /*
     * With ttag we cannot have JSX in plural forms
     * We need a workaround to have the number of messages/conversations in a strong tag
     * So we are surrounding the bold part with ** to replace it later by a strong tag
     */
    const getLabelText = () => {
        if (checkeds) {
            // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
            return conversationMode
                ? c('Info').ngettext(
                      msgid`You selected **${count} conversation** with this label`,
                      `You selected **${count} conversations** with this label`,
                      count
                  )
                : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
                  c('Info').ngettext(
                      msgid`You selected **${count} message** with this label`,
                      `You selected **${count} messages** with this label`,
                      count
                  );
        }
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You have **${count} conversation** tagged with this label`,
                  `You have **${count} conversations** tagged with this label`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You have **${count} message** tagged with this label`,
                  `You have **${count} messages** tagged with this label`,
                  count
              );
    };

    // Replace "**" by strong tags
    const getFormattedText = (text: string) => {
        const splitText = text.split('**');
        // If the length is odd, it means that we can apply the change on the text
        if (splitText.length > 2 && splitText.length % 2 !== 0) {
            const formattedText = splitText.map((s, index) => {
                // All odd indexes corresponds to a part to surround with a tag
                if (index % 2 !== 0) {
                    return <strong key={`formattedText-${s}`}>{s}</strong>;
                }
                return <span key={`formattedText-${s}`}>{s}</span>;
            });

            return <>{formattedText}</>;
        }
        return text;
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
            <p className="mb2 text-keep-space">{showText ? getFormattedText(text) : null}</p>
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
