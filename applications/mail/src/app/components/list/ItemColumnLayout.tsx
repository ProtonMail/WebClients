import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import type { Breakpoints } from '@proton/components';
import { DENSITY } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import ItemAttachmentThumbnails from 'proton-mail/components/list/ItemAttachmentThumbnails';
import { canShowAttachmentThumbnails } from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getLabelIDs, isStarred as testIsStarred } from '../../helpers/elements';
import { useExpiringElement } from '../../hooks/useExpiringElement';
import type { Element } from '../../models/element';
import type { ESMessage } from '../../models/encryptedSearch';
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
    labelID: string;
    elementID?: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders?: ReactNode;
    breakpoints: Breakpoints;
    unread: boolean;
    onBack?: () => void;
    isSelected: boolean;
    attachmentsMetadata?: AttachmentsMetadata[];
    userSettings?: UserSettings;
    showAttachmentThumbnails?: boolean;
}

const ItemColumnLayout = ({
    labelID,
    elementID,
    labels,
    element,
    conversationMode,
    showIcon,
    breakpoints,
    unread,
    onBack = () => {},
    isSelected,
    senders,
    attachmentsMetadata = [],
    userSettings,
    showAttachmentThumbnails,
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

    // translator: This text is displayed in an Encrypted Search context. The user has searched for a specific keyword.
    // In the message list, the user should see the part of the message "body" which contains the keyword. On hover, this text is displayed.
    // The variable "numOccurrences" corresponds to the number of times the keyword has been found in the email content
    const bodyTitle = c('Info').ngettext(
        msgid`${numOccurrences} occurrence found in the mail content`,
        `${numOccurrences} occurrences found in the mail content`,
        numOccurrences
    );

    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(element?.AttachmentInfo);
    const hasLabels = useMemo(() => {
        const allLabelIDs = Object.keys(getLabelIDs(element, labelID));
        const labelIDs = allLabelIDs.filter((ID) => labels?.find((label) => ID === label.ID));
        return !!labelIDs.length;
    }, [element, labels, labelID]);

    const isStarred = testIsStarred(element || ({} as Element));
    const isCompactView = userSettings?.Density === DENSITY.COMPACT;
    const isSnoozeDropdownOpen = snoozeDropdownState === 'open' && snoozedElement?.ID === element.ID;

    const showThumbnails = canShowAttachmentThumbnails(
        isCompactView,
        element,
        attachmentsMetadata,
        showAttachmentThumbnails
    );

    return (
        <div
            className="item-column flex-1 flex flex-nowrap flex-column justify-center item-titlesender"
            data-testid="message-list:message"
        >
            <div className="flex items-center flex-nowrap">
                <div className="flex-1">
                    <div className="flex items-center item-firstline">
                        <div
                            className={clsx(
                                'item-senders flex-1 flex items-center flex-nowrap pr-4',
                                unread && 'text-semibold'
                            )}
                        >
                            <ItemUnread
                                element={element}
                                labelID={labelID}
                                className="item-unread-dot sr-only"
                                isSelected={isSelected}
                            />
                            <ItemAction element={element} className="mr-1 my-auto shrink-0" />
                            <span
                                className="inline-flex max-w-full text-ellipsis"
                                data-testid="message-column:sender-address"
                            >
                                {senders}
                            </span>
                        </div>

                        <span
                            className={clsx(
                                'item-firstline-infos shrink-0 flex flex-nowrap items-center',
                                isSnoozeDropdownOpen && 'invisible'
                            )}
                        >
                            <ItemDate
                                element={element}
                                labelID={labelID}
                                className={clsx('item-senddate-col text-sm', unread && 'text-semibold')}
                                isInListView
                            />
                        </span>
                    </div>

                    <div className="flex flex-nowrap items-center item-secondline max-w-full">
                        <div
                            className={clsx(
                                'item-subject flex-1 flex flex-nowrap items-center',
                                unread && 'text-semibold'
                            )}
                        >
                            {showIcon && (
                                <span className="flex shrink-0">
                                    <ItemLocation element={element} labelID={labelID} />
                                </span>
                            )}
                            {conversationMode && <NumMessages className="mr-1 shrink-0" conversation={element} />}
                            <span
                                role="heading"
                                aria-level={2}
                                className="inline-block max-w-full mr-1 text-ellipsis"
                                title={Subject}
                                data-testid="message-column:subject"
                            >
                                {subjectContent}
                            </span>
                        </div>

                        <div className="item-icons shrink-0 flex-nowrap hidden md:flex">
                            <span className="flex item-meta-infos gap-1">
                                {hasLabels && isCompactView && !isSnoozeDropdownOpen && (
                                    <ItemLabels
                                        className="ml-1"
                                        labels={labels}
                                        element={element}
                                        labelID={labelID}
                                        maxNumber={1}
                                    />
                                )}
                                {hasExpiration && !isSnoozeDropdownOpen && (
                                    <ItemExpiration
                                        expirationTime={expirationTime}
                                        className="self-center"
                                        element={element}
                                        labelID={labelID}
                                    />
                                )}
                                {!isSnoozeDropdownOpen && (
                                    <ItemAttachmentIcon
                                        icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                        element={element}
                                        className="self-center"
                                    />
                                )}
                                <span className="flex *:flex self-center my-auto empty:hidden">
                                    {isStarred && !isSnoozeDropdownOpen && <ItemStar element={element} />}
                                </span>
                            </span>
                        </div>
                        <div className="item-icons flex flex-row shrink-0 flex-nowrap flex md:hidden">
                            {hasExpiration && (
                                <ItemExpiration
                                    element={element}
                                    expirationTime={expirationTime}
                                    className="ml-1 self-center"
                                    labelID={labelID}
                                />
                            )}
                            <ItemAttachmentIcon
                                icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                element={element}
                                className="ml-1 self-center"
                            />
                            <span className="ml-1 flex *:flex self-center my-auto empty:hidden">
                                <ItemStar element={element} />
                            </span>
                        </div>
                    </div>
                </div>
                <ItemHoverButtons
                    element={element}
                    labelID={labelID}
                    elementID={elementID}
                    onBack={onBack}
                    size="small"
                />
            </div>

            {hasLabels && !isCompactView && (
                <div className="flex flex-nowrap items-center max-w-full overflow-hidden">
                    <div className="item-icons flex shrink-0 flex-nowrap mt-1">
                        <ItemLabels
                            className="ml-2"
                            labels={labels}
                            element={element}
                            labelID={labelID}
                            maxNumber={breakpoints.viewportWidth['<=small'] ? 1 : 5}
                            isCollapsed={false}
                        />
                    </div>
                </div>
            )}

            {showThumbnails && <ItemAttachmentThumbnails attachmentsMetadata={attachmentsMetadata} className="mt-1" />}

            {!!resultJSX && (
                <>
                    <div
                        className={clsx([
                            'flex flex-nowrap items-center item-secondline item-es-result max-w-8/10 overflow-hidden',
                            isCompactView && 'mb-3',
                        ])}
                        aria-hidden="true"
                    >
                        <div className="item-subject flex-1 flex flex-nowrap items-center">
                            <span className="inline-block max-w-full text-ellipsis" title={bodyTitle}>
                                {resultJSX}
                            </span>
                        </div>
                    </div>
                    <div className="sr-only">{bodyTitle}</div>
                </>
            )}
        </div>
    );
};

export default ItemColumnLayout;
