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
            <div className="mtauto mbauto flex w2e" data-testid={unread}>
                <ItemStar element={element} />
            </div>
            <div className={classnames(['item-senders flex flex-nowrap mauto pr1', unread && 'text-bold'])}>
                <ItemAction element={element} className="mr0-5 flex-item-noshrink mtauto mbauto" />
                <span className="max-w100 text-ellipsis" title={addresses} data-testid="message-row:sender-address">
                    {sendersContent}
                </span>
            </div>

            <div className="item-subject flex-item-fluid flex flex-align-items-center flex-nowrap mauto">
                <div className="flex flex-column inline-block">
                    <span
                        role="heading"
                        aria-level={2}
                        className={classnames(['max-w100 text-ellipsis mr1', unread && 'text-bold'])}
                        title={Subject}
                        data-testid="message-row:subject"
                    >
                        {conversationMode && (
                            <NumMessages
                                className={classnames(['mr0-25', unread && 'text-bold'])}
                                conversation={element}
                            />
                        )}
                        {showIcon && (
                            <span className="mr0-25 inline-flex flex-item-noshrink">
                                <ItemLocation element={element} labelID={labelID} />
                            </span>
                        )}
                        {subjectContent}
                    </span>

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

            <span className="flex w3e ml0-5 text-center flex-justify-end">
                {!!element.ExpirationTime && <ItemExpiration element={element} />}
                <ItemAttachmentIcon
                    icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                    element={element}
                    className="flex-item-noshrink"
                />
            </span>

            <span className="ml1 flex w15e flex-nowrap flex-align-items-center flex-justify-end">
                <ItemHoverButtons
                    className="mr1"
                    element={element}
                    labelID={labelID}
                    elementID={elementID}
                    onBack={onBack}
                    hasStar={false}
                />
                <span className="opacity-on-hover-hide flex flex-nowrap item-senddate-row w13e ml0-5 flex-justify-end flex-align-items-center">
                    <ItemDate
                        element={element}
                        labelID={labelID}
                        className={unread ? 'text-bold' : undefined}
                        useTooltip
                    />

                    <span className="flex w2e ml0-5 text-center flex-align-items-center">
                        <ItemUnread element={element} labelID={labelID} className="ml0-5" />
                    </span>
                </span>
            </span>
        </div>
    );
};

export default ItemRowLayout;
