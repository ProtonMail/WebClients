import { ReactNode, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useExpiringElement } from '../../hooks/useExpiringElement';
import { Element } from '../../models/element';
import { ESMessage } from '../../models/encryptedSearch';
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
    elementID?: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders: ReactNode;
    unread: boolean;
    onBack: () => void;
}

const ItemRowLayout = ({
    isCompactView,
    labelID,
    elementID,
    labels,
    element,
    conversationMode,
    showIcon,
    senders,
    unread,
    onBack,
}: Props) => {
    const { shouldHighlight, highlightMetadata, getESDBStatus } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();
    const { contentIndexingDone } = getESDBStatus();

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

    return (
        <div className="flex-item-fluid flex flex-align-items-center flex-nowrap flex-row item-titlesender">
            <div className="my-auto flex w2e" data-testid={unread}>
                <ItemStar element={element} />
            </div>
            <div className={clsx(['item-senders flex flex-nowrap m-auto pr-4', unread && 'text-bold'])}>
                <ItemUnread element={element} labelID={labelID} className="mr-0.5 item-unread-dot" />
                <ItemAction element={element} className="mr-2 flex-item-noshrink my-auto" />
                <span
                    className="max-w100 text-ellipsis flex flex-align-items-center"
                    data-testid="message-row:sender-address"
                >
                    {senders}
                </span>
            </div>

            <div className="item-subject flex-item-fluid flex flex-align-items-center flex-nowrap m-auto">
                <div className="flex flex-column inline-block">
                    <span
                        role="heading"
                        aria-level={2}
                        className={clsx(['max-w100 text-ellipsis mr-4', unread && 'text-bold'])}
                        title={Subject}
                        data-testid="message-row:subject"
                    >
                        {showIcon && (
                            <span className="mr-1 inline-flex flex-item-noshrink align-bottom">
                                <ItemLocation element={element} labelID={labelID} />
                            </span>
                        )}
                        {conversationMode && (
                            <NumMessages
                                className={clsx(['mr-1 flex-item-noshrink', unread && 'text-bold'])}
                                conversation={element}
                            />
                        )}
                        {subjectContent}
                    </span>

                    {!!resultJSX && highlightData && (
                        <>
                            <span
                                className={clsx(['max-w100 text-ellipsis mr-4', unread && 'text-bold'])}
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
                className="flex-item-noshrink ml-auto"
                showDropdown={false}
                isCollapsed={false}
            />

            <span className="flex flex-nowrap w5e ml-2 text-center flex-justify-end">
                {hasExpiration && (
                    <ItemExpiration expirationTime={expirationTime} element={element} labelID={labelID} />
                )}
                <ItemAttachmentIcon
                    icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                    element={element}
                    className="flex-item-noshrink ml-2"
                />
            </span>

            <span className="ml-4 flex w13e flex-nowrap flex-align-items-center flex-justify-end">
                <ItemHoverButtons
                    element={element}
                    labelID={labelID}
                    elementID={elementID}
                    onBack={onBack}
                    hasStar={false}
                    size={isCompactView ? 'small' : 'medium'}
                />
                <span className="item-senddate-row ml-2 flex flex-item-fluid flex-nowrap flex-justify-end flex-align-items-center">
                    <ItemDate
                        element={element}
                        labelID={labelID}
                        className={unread ? 'text-bold' : undefined}
                        useTooltip
                    />
                </span>
            </span>
        </div>
    );
};

export default ItemRowLayout;
