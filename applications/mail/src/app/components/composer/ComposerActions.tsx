import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import { getAttachments, hasFlag } from 'proton-shared/lib/mail/messages';
import React, { MutableRefObject } from 'react';
import { c } from 'ttag';
import { isToday, isYesterday } from 'date-fns';
import { Button, classnames, Tooltip, Icon, EllipsisLoader, useMailSettings } from 'react-components';
import { metaKey, shiftKey, altKey } from 'proton-shared/lib/helpers/browser';
import { formatSimpleDate } from '../../helpers/date';
import { MessageExtended } from '../../models/message';
import AttachmentsButton from '../attachment/AttachmentsButton';

interface Props {
    className?: string;
    message: MessageExtended;
    date: Date;
    lock: boolean;
    opening: boolean;
    syncInProgress: boolean;
    onAddAttachments: (files: File[]) => void;
    onPassword: () => void;
    onExpiration: () => void;
    onSend: () => Promise<void>;
    onDelete: () => Promise<void>;
    addressesBlurRef: MutableRefObject<() => void>;
    attachmentTriggerRef: MutableRefObject<() => void>;
}

const ComposerActions = ({
    className,
    message,
    date,
    lock,
    opening,
    syncInProgress,
    onAddAttachments,
    onPassword,
    onExpiration,
    onSend,
    onDelete,
    addressesBlurRef,
    attachmentTriggerRef,
}: Props) => {
    const isAttachments = getAttachments(message.data).length > 0;
    const isPassword = hasFlag(MESSAGE_FLAGS.FLAG_INTERNAL)(message.data) && message.data?.Password;
    const isExpiration = !!message.expiresIn;
    const sendDisabled = lock;
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

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
            dateMessage = c('Info').t`Saved at ${dateString}`;
        } else if (isYesterday(date)) {
            dateMessage = c('Info').t`Saved ${dateString}`;
        } else {
            dateMessage = c('Info').t`Saved on ${dateString}`;
        }
    } else {
        dateMessage = c('Action').t`Not saved`;
    }

    const titleAttachment = Shortcuts ? (
        <>
            {c('Title').t`Attachments`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">{shiftKey}</kbd> +{' '}
            <kbd className="no-border">A</kbd>
        </>
    ) : (
        c('Title').t`Attachments`
    );
    const titleExpiration = Shortcuts ? (
        <>
            {c('Title').t`Expiration time`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">{shiftKey}</kbd> +{' '}
            <kbd className="no-border">X</kbd>
        </>
    ) : (
        c('Title').t`Expiration time`
    );
    const titleEncryption = Shortcuts ? (
        <>
            {c('Title').t`Encryption`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">{shiftKey}</kbd> +{' '}
            <kbd className="no-border">E</kbd>
        </>
    ) : (
        c('Title').t`Encryption`
    );
    const titleDeleteDraft = Shortcuts ? (
        <>
            {c('Title').t`Delete draft`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">{altKey}</kbd> +{' '}
            <kbd className="no-border">Backspace</kbd>
        </>
    ) : (
        c('Title').t`Delete draft`
    );
    const titleSendButton = Shortcuts ? (
        <>
            {c('Title').t`Send email`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">Enter</kbd>
        </>
    ) : null;

    return (
        <footer
            className={classnames([
                'composer-actions flex-item-noshrink flex flex-row-reverse flex-align-self-center w100 pl1 pr1 mb0-5',
                className,
            ])}
            onClick={addressesBlurRef.current}
        >
            <Tooltip title={titleSendButton}>
                <Button
                    color="norm"
                    className="composer-send-button"
                    disabled={sendDisabled}
                    onClick={onSend}
                    data-testid="send-button"
                >
                    <Icon name="sent" className="no-desktop no-tablet on-mobile-flex" />
                    <span className="pl1 pr1 no-mobile">{c('Action').t`Send`}</span>
                </Button>
            </Tooltip>
            <div className="flex flex-item-fluid">
                <div className="flex">
                    <Tooltip title={titleAttachment}>
                        <span>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={lock}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                            />
                        </span>
                    </Tooltip>
                    <Tooltip title={titleExpiration}>
                        <Button
                            icon
                            shape="outline"
                            color={isExpiration ? 'norm' : undefined}
                            onClick={onExpiration}
                            disabled={lock}
                            className="ml0-5"
                        >
                            <Icon name="expiration" alt={c('Action').t`Expiration time`} />
                        </Button>
                    </Tooltip>
                    <Tooltip title={titleEncryption}>
                        <Button
                            icon
                            data-test-id="composer:encryption-lock"
                            color={isPassword ? 'norm' : undefined}
                            shape="outline"
                            onClick={onPassword}
                            disabled={lock}
                            className="ml0-5"
                        >
                            <Icon name="lock-alone" alt={c('Action').t`Encryption`} />
                        </Button>
                    </Tooltip>
                </div>
                <div className="flex mlauto">
                    <span className="mr0-5 mtauto mbauto no-mobile">{dateMessage}</span>
                    <Tooltip title={titleDeleteDraft}>
                        <Button icon disabled={lock} onClick={onDelete} shape="outline" className="mr0-5">
                            <Icon name="trash" alt={c('Action').t`Delete draft`} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </footer>
    );
};

export default ComposerActions;
