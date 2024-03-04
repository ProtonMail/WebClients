import { ReactNode, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';
import { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import ItemAttachmentThumbnails from 'proton-mail/components/list/ItemAttachmentThumbnails';
import { MAX_ROW_ATTACHMENT_THUMBNAILS } from 'proton-mail/constants';
import { canShowAttachmentThumbnails } from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useExpiringElement } from '../../hooks/useExpiringElement';
import { Element } from '../../models/element';
import { ESMessage } from '../../models/encryptedSearch';
import { selectSnoozeDropdownState, selectSnoozeElement } from '../../store/snooze/snoozeSliceSelectors';
import NumMessages from '../conversation/NumMessages';
import ItemAction from './ItemAction';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemDate from './ItemDate';
import ItemHoverButtons from './ItemHoverButtons';
import ItemLabels from './ItemLabels';
import ItemLocation from './ItemLocation';
import ItemStar from './ItemStar';
import ItemUnread from './ItemUnread';
import ItemExpiration from './item-expiration/ItemExpiration';

interface Props {
    isCompactView: boolean;
    labelID: string;
    loading: boolean;
    elementID?: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders?: ReactNode;
    unread: boolean;
    onBack?: () => void;
    attachmentsMetadata?: AttachmentsMetadata[];
    isDelightMailListEnabled?: boolean;
    showAttachmentThumbnails?: boolean;
}

const ItemRowLayout = ({
    isCompactView,
    labelID,
    loading,
    elementID,
    labels,
    element,
    conversationMode,
    showIcon,
    senders,
    unread,
    onBack = () => {},
    attachmentsMetadata = [],
    showAttachmentThumbnails,
    isDelightMailListEnabled,
}: Props) => {
    const { shouldHighlight, highlightMetadata, esStatus } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();
    const { contentIndexingDone } = esStatus;

    const snoozedElement = useMailSelector(selectSnoozeElement);
    const snoozeDropdownState = useMailSelector(selectSnoozeDropdownState);

    const { expirationTime, hasExpiration } = useExpiringElement(element, labelID, conversationMode);

    const body = contentIndexingDone ? (element as ESMessage).decryptedBody : undefined;
    const { Subject } = element;

    const subjectContent = useMemo(
        () => (highlightData && Subject ? highlightMetadata(Subject, unread, true).resultJSX : Subject),
        [Subject, highlightData, highlightMetadata, unread]
    );

    const { resultJSX, numOccurrences } = useMemo(
        () =>
            body && highlightData ? highlightMetadata(body, unread, true) : { resultJSX: undefined, numOccurrences: 0 },
        [body, unread, highlightData, highlightMetadata]
    );
    const bodyTitle = c('Info').ngettext(
        msgid`${numOccurrences} occurrence found`,
        `${numOccurrences} occurrences found`,
        numOccurrences
    );

    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(element?.AttachmentInfo);

    const showThumbnails = canShowAttachmentThumbnails(
        isCompactView,
        element,
        attachmentsMetadata,
        showAttachmentThumbnails
    );

    if (isDelightMailListEnabled) {
        return (
            <div className={clsx('flex flex-nowrap flex-column w-full my-auto', showThumbnails && 'mt-1')}>
                <div className="flex items-center justify-start flex-nowrap flex-row item-titlesender w-full gap-3">
                    <div className="my-auto flex shrink-0" data-testid={unread}>
                        <ItemStar element={element} />
                    </div>
                    <div
                        className={clsx(['item-senders flex flex-nowrap shrink-0 w-custom', unread && 'text-semibold'])}
                        style={{ '--w-custom': '15rem' }}
                    >
                        <ItemUnread element={element} labelID={labelID} className="delight-item-unread-dot sr-only" />
                        <ItemAction element={element} className="mr-2 shrink-0 my-auto" />
                        <span
                            className="max-w-full text-ellipsis flex items-center"
                            data-testid="message-row:sender-address"
                        >
                            {senders}
                        </span>
                    </div>

                    <ItemLabels
                        labels={labels}
                        element={element}
                        labelID={labelID}
                        maxNumber={1}
                        className="shrink-0"
                        showDropdown={false}
                        isCollapsed={false}
                    />

                    <div
                        className={clsx('item-subject flex items-center flex-nowrap', loading && 'w-custom')}
                        style={loading ? { '--w-custom': '15rem' } : {}}
                    >
                        <div className="flex flex-column inline-block">
                            <span
                                role="heading"
                                aria-level={2}
                                className={clsx(['max-w-full text-ellipsis', unread && 'text-semibold'])}
                                title={Subject}
                                data-testid="message-row:subject"
                            >
                                {showIcon && (
                                    <span className="inline-flex shrink-0 align-bottom mr-1">
                                        <ItemLocation element={element} labelID={labelID} />
                                    </span>
                                )}
                                {conversationMode && <NumMessages className="shrink-0 mr-1" conversation={element} />}
                                <span>{subjectContent}</span>
                            </span>

                            {!!resultJSX && highlightData && (
                                <>
                                    <span
                                        className={clsx(['max-w-full text-ellipsis mr-4', unread && 'text-semibold'])}
                                        title={bodyTitle}
                                        aria-hidden="true"
                                    >
                                        {resultJSX}
                                    </span>
                                    <span className="sr-only">{bodyTitle}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <span className="m-auto" />

                    <span className="flex flex-nowrap items-center shrink-0 justify-end">
                        <ItemHoverButtons
                            element={element}
                            labelID={labelID}
                            elementID={elementID}
                            onBack={onBack}
                            hasStar={false}
                            size="small"
                            isDelightMailListEnabled={isDelightMailListEnabled}
                        />
                        <span
                            className={clsx(
                                'item-senddate-row flex flex-nowrap items-center gap-3',
                                loading && 'w-custom'
                            )}
                            style={loading ? { '--w-custom': '5rem' } : {}}
                        >
                            {hasExpiration && (
                                <ItemExpiration expirationTime={expirationTime} element={element} labelID={labelID} />
                            )}

                            <ItemAttachmentIcon
                                icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                element={element}
                                className="shrink-0"
                            />

                            <span
                                className={clsx(
                                    'flex flex-1 flex-nowrap justify-end items-center',
                                    snoozeDropdownState && snoozedElement?.ID === element.ID && 'invisible'
                                )}
                            >
                                <ItemDate
                                    element={element}
                                    labelID={labelID}
                                    className={clsx('text-sm', unread ? 'text-semibold' : undefined)}
                                    isInListView
                                />
                            </span>
                        </span>
                    </span>
                </div>
                {showThumbnails && (
                    <div className="shrink-0 flex items-center flex-nowrap flex-row mt-1">
                        <div className="shrink-0 w-custom" style={{ '--w-custom': '17.5rem' }}></div>

                        <ItemAttachmentThumbnails
                            attachmentsMetadata={attachmentsMetadata}
                            maxAttachment={MAX_ROW_ATTACHMENT_THUMBNAILS}
                            className="flex-1 attachment-thumbnail-row"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex items-center">
            <div className="flex items-center flex-nowrap flex-row item-titlesender">
                <div className="my-auto flex w-custom" style={{ '--w-custom': '2em' }} data-testid={unread}>
                    <ItemStar element={element} />
                </div>
                <div className={clsx(['item-senders flex flex-nowrap m-auto pr-4', unread && 'text-bold'])}>
                    <ItemUnread element={element} labelID={labelID} className="mr-0.5 item-unread-dot" />
                    <ItemAction element={element} className="mr-2 shrink-0 my-auto" />
                    {senders && (
                        <span
                            className="max-w-full text-ellipsis flex items-center"
                            data-testid="message-row:sender-address"
                        >
                            {senders}
                        </span>
                    )}
                </div>

                <div className="item-subject flex-1 flex items-center flex-nowrap m-auto">
                    <div className="flex flex-column inline-block w-full">
                        <span
                            role="heading"
                            aria-level={2}
                            className={clsx(['max-w-full text-ellipsis mr-4', unread && 'text-bold'])}
                            title={Subject}
                            data-testid="message-row:subject"
                        >
                            {showIcon && (
                                <span className="mr-1 inline-flex shrink-0 align-bottom">
                                    <ItemLocation element={element} labelID={labelID} />
                                </span>
                            )}
                            {conversationMode && (
                                <NumMessages
                                    className={clsx(['mr-1 shrink-0', unread && 'text-bold'])}
                                    conversation={element}
                                />
                            )}
                            {subjectContent}
                        </span>

                        {!!resultJSX && highlightData && (
                            <>
                                <span
                                    className={clsx(['max-w-full text-ellipsis mr-4', unread && 'text-bold'])}
                                    title={bodyTitle}
                                    aria-hidden="true"
                                >
                                    {resultJSX}
                                </span>
                                <span className="sr-only">{bodyTitle}</span>
                            </>
                        )}
                    </div>
                </div>

                <ItemLabels
                    labels={labels}
                    element={element}
                    labelID={labelID}
                    maxNumber={1}
                    className="shrink-0 ml-auto"
                    showDropdown={false}
                    isCollapsed={false}
                />

                <span
                    className="flex flex-nowrap w-custom ml-2 text-center justify-end"
                    style={{ '--w-custom': '7em' }}
                >
                    {hasExpiration && (
                        <ItemExpiration expirationTime={expirationTime} element={element} labelID={labelID} />
                    )}
                    <ItemAttachmentIcon
                        icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                        element={element}
                        className="shrink-0 ml-2"
                    />
                </span>

                <span
                    className="ml-4 flex w-custom flex-nowrap items-center justify-end"
                    style={{ '--w-custom': '13em' }}
                >
                    <ItemHoverButtons
                        element={element}
                        labelID={labelID}
                        elementID={elementID}
                        onBack={onBack}
                        hasStar={false}
                        size={isCompactView ? 'small' : 'medium'}
                        isDelightMailListEnabled={isDelightMailListEnabled}
                    />
                    <span
                        className={clsx(
                            'item-senddate-row ml-2 flex flex-1 flex-nowrap justify-end items-center',
                            snoozeDropdownState && snoozedElement?.ID === element.ID && 'invisible'
                        )}
                    >
                        <ItemDate
                            element={element}
                            labelID={labelID}
                            className={unread ? 'text-bold' : undefined}
                            isInListView
                        />
                    </span>
                </span>
            </div>
            {showThumbnails && (
                <div className="flex items-center flex-nowrap flex-row">
                    <div className="my-auto flex w-custom" style={{ '--w-custom': '2em' }}></div>
                    <div className={clsx(['item-senders flex pr-4'])}></div>
                    <ItemAttachmentThumbnails
                        attachmentsMetadata={attachmentsMetadata}
                        maxAttachment={MAX_ROW_ATTACHMENT_THUMBNAILS}
                        className="flex-1 attachment-thumbnail-row"
                    />
                </div>
            )}
        </div>
    );
};

export default ItemRowLayout;
