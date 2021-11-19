import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { getAttachments, hasFlag } from '@proton/shared/lib/mail/messages';
import { MutableRefObject, useMemo, useRef } from 'react';
import { c } from 'ttag';
import { isToday, isYesterday } from 'date-fns';
import {
    Button,
    classnames,
    Tooltip,
    Icon,
    EllipsisLoader,
    useMailSettings,
    useFeature,
    FeatureCode,
    useUser,
    Spotlight,
    Href,
    useSpotlightOnFeature,
} from '@proton/components';
import { metaKey, shiftKey, altKey } from '@proton/shared/lib/helpers/browser';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { formatSimpleDate } from '../../helpers/date';
import { MessageExtended } from '../../models/message';
import AttachmentsButton from '../attachment/AttachmentsButton';
import SendActions from './SendActions';
import EditorToolbarExtension from './editor/EditorToolbarExtension';
import { MessageChangeFlag } from './Composer';
import ComposerMoreOptionsDropdown from './editor/ComposerMoreOptionsDropdown';

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
    onScheduleSendModal: () => void;
    onSend: () => Promise<void>;
    onDelete: () => void;
    addressesBlurRef: MutableRefObject<() => void>;
    attachmentTriggerRef: MutableRefObject<() => void>;
    loadingScheduleCount: boolean;
    onChangeFlag: MessageChangeFlag;
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
    onScheduleSendModal,
    onSend,
    onDelete,
    addressesBlurRef,
    attachmentTriggerRef,
    loadingScheduleCount,
    onChangeFlag,
}: Props) => {
    const isAttachments = getAttachments(message.data).length > 0;
    const isPassword = hasFlag(MESSAGE_FLAGS.FLAG_INTERNAL)(message.data) && !!message.data?.Password;
    const isExpiration = !!message.expiresIn;
    const sendDisabled = lock;
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [{ hasPaidMail }] = useUser();

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
    const titleMoreOptions = c('Title').t`More options`;
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

    const { feature, loading: loadingFeature } = useFeature(FeatureCode.ScheduledSend);
    const hasScheduleSendAccess = !loadingFeature && feature?.Value && hasPaidMail;

    const dropdownRef = useRef(null);
    const {
        show: showSpotlight,
        onDisplayed,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(FeatureCode.SpotlightScheduledSend, !opening && hasScheduleSendAccess);

    const handleScheduleSend = () => {
        onCloseSpotlight();
        onScheduleSendModal();
    };

    const toolbarExtension = useMemo(
        () => <EditorToolbarExtension message={message.data} onChangeFlag={onChangeFlag} />,
        [message.data, onChangeFlag]
    );

    return (
        <footer
            data-testid="composer:footer"
            className={classnames(['composer-actions flex-item-noshrink flex max-w100', className])}
            onClick={addressesBlurRef.current}
        >
            <div className="flex flex-row-reverse flex-align-self-center w100 ml0-5 mr1-5 pl1-25 pr0-25 mb1">
                <Spotlight
                    originalPlacement="top-right"
                    show={showSpotlight}
                    onDisplayed={onDisplayed}
                    anchorRef={dropdownRef}
                    content={
                        <>
                            {c('Spotlight').t`You can now schedule your messages to be sent later`}
                            <br />
                            <Href
                                url="https://protonmail.com/support/knowledge-base/scheduled-send/"
                                title="Scheduled send"
                            >
                                {c('Info').t`Learn more`}
                            </Href>
                        </>
                    }
                >
                    <SendActions
                        disabled={loadingFeature || loadingScheduleCount}
                        loading={loadingFeature || loadingScheduleCount}
                        shape="solid"
                        color="norm"
                        mainAction={
                            <Tooltip title={titleSendButton}>
                                <Button
                                    loading={loadingFeature}
                                    onClick={onSend}
                                    disabled={sendDisabled}
                                    className="composer-send-button"
                                    data-testid="composer:send-button"
                                >
                                    <Icon name="paper-plane" className="no-desktop no-tablet on-mobile-flex" />
                                    <span className="pl1 pr1 no-mobile">{c('Action').t`Send`}</span>
                                </Button>
                            </Tooltip>
                        }
                        secondAction={
                            hasScheduleSendAccess ? (
                                <Tooltip>
                                    <DropdownMenuButton
                                        className="text-left flex flex-align-items-center"
                                        onClick={handleScheduleSend}
                                        data-testid="composer:schedule-send-button"
                                    >
                                        <Icon name="clock" className="flex-item-noshrink" />
                                        <span className="pl0-5 pr0-5 flex-item-fluid">{c('Action')
                                            .t`Schedule send`}</span>
                                    </DropdownMenuButton>
                                </Tooltip>
                            ) : undefined
                        }
                        dropdownRef={dropdownRef}
                    />
                </Spotlight>

                <div className="flex flex-item-fluid">
                    <div className="flex">
                        <Tooltip title={titleDeleteDraft}>
                            <Button
                                icon
                                disabled={lock}
                                onClick={onDelete}
                                shape="ghost"
                                className="mr0-5"
                                data-testid="composer:delete-draft-button"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete draft`} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={titleEncryption}>
                            <Button
                                icon
                                color={isPassword ? 'norm' : undefined}
                                shape="ghost"
                                data-testid="composer:password-button"
                                onClick={onPassword}
                                disabled={lock}
                                className="mr0-5"
                                aria-pressed={isPassword}
                            >
                                <Icon name="lock" alt={c('Action').t`Encryption`} />
                            </Button>
                        </Tooltip>
                        <ComposerMoreOptionsDropdown
                            title={titleMoreOptions}
                            titleTooltip={titleMoreOptions}
                            className="button button-for-icon composer-more-dropdown"
                            content={
                                <Icon
                                    name="ellipsis"
                                    alt={titleMoreOptions}
                                    className={classnames([isExpiration && 'color-primary'])}
                                />
                            }
                        >
                            {toolbarExtension}
                            <div className="dropdown-item-hr" key="hr-more-options" />
                            <DropdownMenuButton
                                className={classnames(['text-left flex flex-nowrap', isExpiration && 'color-primary'])}
                                onClick={onExpiration}
                                aria-pressed={isExpiration}
                                disabled={lock}
                                data-testid="composer:expiration-button"
                            >
                                <Icon name="hourglass-empty" className="mt0-25" />
                                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action')
                                    .t`Set expiration time`}</span>
                            </DropdownMenuButton>
                        </ComposerMoreOptionsDropdown>
                    </div>
                    <div className="flex-item-fluid flex pr1">
                        <span className="mr0-5 mauto no-mobile color-weak">{dateMessage}</span>
                        <Tooltip title={titleAttachment}>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={lock}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                                data-testid="composer:attachment-button"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ComposerActions;
