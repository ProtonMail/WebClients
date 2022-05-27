import { useMemo } from 'react';
import { c, msgid } from 'ttag';
import { classnames } from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';

import ItemStar from './ItemStar';
import ItemLabels from './ItemLabels';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemLocation from './ItemLocation';
import ItemDate from './ItemDate';
import NumMessages from '../conversation/NumMessages';
import { Element } from '../../models/element';
import ItemExpiration from './ItemExpiration';
import ItemAction from './ItemAction';
import { ESMessage } from '../../models/encryptedSearch';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import ItemHoverButtons from './ItemHoverButtons';
import ItemUnread from './ItemUnread';

interface Props {
    labelID: string;
    elementID?: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
    mouseHover?: boolean;
    onBack: () => void;
}

const ItemRowLayout = ({
    labelID,
    elementID,
    labels,
    element,
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading,
    mouseHover,
    onBack,
}: Props) => {
    const { shouldHighlight, highlightMetadata } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();

    const body = (element as ESMessage).decryptedBody;
    const { Subject, Size } = element;
    const size = humanSize(Size);

    const sendersContent = useMemo(
        () =>
            !loading && displayRecipients && !senders
                ? c('Info').t`(No Recipient)`
                : highlightData
                ? highlightMetadata(senders, unread, true).resultJSX
                : senders,
        [loading, displayRecipients, senders, highlightData]
    );
    const subjectContent = useMemo(
        () => (highlightData && Subject ? highlightMetadata(Subject, unread, true).resultJSX : Subject),
        [Subject, highlightData]
    );

    const { resultJSX, numOccurrences } = useMemo(
        () =>
            body && highlightData ? highlightMetadata(body, unread, true) : { resultJSX: undefined, numOccurrences: 0 },
        [body, unread]
    );
    const bodyTitle = c('Info').ngettext(
        msgid`${numOccurrences} occurrence found`,
        `${numOccurrences} occurrences found`,
        numOccurrences
    );

    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(element?.AttachmentInfo);

    return (
        <div className="flex-item-fluid flex flex-align-items-center flex-nowrap flex-row item-titlesender">
            <div className={classnames(['item-senders w20 flex flex-nowrap mauto pr1', unread && 'text-bold'])}>
                <span className="max-w100 text-ellipsis" title={addresses} data-testid="message-row:sender-address">
                    {sendersContent}
                </span>
                <ItemAction element={element} className="ml0-5 flex-item-noshrink mtauto mbauto" />
            </div>

            <div className="item-subject flex-item-fluid flex flex-align-items-center flex-nowrap mauto">
                {showIcon && (
                    <span className="mr0-25 inline-flex flex-item-noshrink">
                        <ItemLocation element={element} labelID={labelID} />
                    </span>
                )}
                <div className="flex flex-column inline-block">
                    <span
                        role="heading"
                        aria-level={2}
                        className={classnames(['max-w100 text-ellipsis mr1', unread && 'text-bold'])}
                        title={Subject}
                        data-testid="message-row:subject"
                    >
                        {subjectContent}
                    </span>

                    {conversationMode && (
                        <NumMessages
                            className={classnames(['mr0-25 flex-item-noshrink', unread && 'text-bold'])}
                            conversation={element}
                        />
                    )}

                    {!!resultJSX && highlightData && (
                        <>
                            <span
                                className={classnames(['max-w100 text-ellipsis mr1', unread && 'text-bold'])}
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
                className="flex-item-noshrink mlauto"
                showDropdown={false}
                isCollapsed={false}
            />

            <span className="item-weight mtauto mbauto ml1 text-right" data-testid="message-row:item-size">
                {!loading && size}
            </span>

            {mouseHover ? (
                <ItemHoverButtons element={element} labelID={labelID} elementID={elementID} onBack={onBack} />
            ) : (
                <>
                    <span className="flex w2e ml0-5 text-center">
                        {!!element.ExpirationTime && <ItemExpiration element={element} className="mr0-5" />}
                        <ItemAttachmentIcon
                            icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                            element={element}
                            className="flex-item-noshrink"
                        />
                        <div className="mtauto mbauto flex mr0-5" data-testid={unread}>
                            <ItemStar element={element} />
                        </div>
                    </span>

                    <span className="item-senddate-row w13e ml1 flex flex-nowrap flex-align-items-center flex-justify-end">
                        <ItemDate
                            element={element}
                            labelID={labelID}
                            className={unread ? 'text-bold' : undefined}
                            useTooltip
                        />
                    </span>

                    <ItemUnread element={element} labelID={labelID} className="ml0-5" />
                </>
            )}
        </div>
    );
};

export default ItemRowLayout;
