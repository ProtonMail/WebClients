import { isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { EllipsisLoader } from '@proton/components';
import { altKey, metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';

import { formatSimpleDate } from 'proton-mail/helpers/date';
import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    opening: boolean;
    syncInProgress: boolean;
    date: Date;
}

const useComposerSendActionsText = ({ opening, syncInProgress, date }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');

    let dateMessage: string | string[];
    if (opening) {
        const ellipsis = <EllipsisLoader key="ellipsis1" />;
        dateMessage = c('Action').jt`Loading${ellipsis}`;
    } else if (syncInProgress) {
        const ellipsis = <EllipsisLoader key="ellipsis2" />;
        dateMessage = c('Action').jt`Saving${ellipsis}`;
    } else if (date.getTime() !== 0) {
        const dateString = formatSimpleDate(date);
        if (isToday(date)) {
            // translator: Full sentense would be: "Saved at 12:00 AM"
            dateMessage = c('Info').t`Saved at ${dateString}`;
        } else if (isYesterday(date)) {
            dateMessage = c('Info').t`Saved yesterday`;
        } else {
            // translator: Full sentense could be: "Saved: Tuesday" or "Saved: Apr 29, 1453"
            dateMessage = c('Info').t`Saved: ${dateString}`;
        }
    } else {
        dateMessage = c('Action').t`Not saved`;
    }

    const titleAttachment = Shortcuts ? (
        <>
            {c('Title').t`Attachments`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut={shiftKey} /> + <Kbd shortcut="A" />
        </>
    ) : (
        c('Title').t`Attachments`
    );

    const titleDeleteDraft = Shortcuts ? (
        <>
            {c('Title').t`Delete draft`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut={altKey} /> + <Kbd shortcut="Backspace" />
        </>
    ) : (
        c('Title').t`Delete draft`
    );
    const titleSendButton = Shortcuts ? (
        <>
            {c('Title').t`Send email`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut="Enter" />
        </>
    ) : null;

    const titleAssistantButton = c('Action').t`Generate text`;

    return {
        dateMessage,
        titleAttachment,
        titleDeleteDraft,
        titleSendButton,
        titleAssistantButton,
    };
};
export default useComposerSendActionsText;
