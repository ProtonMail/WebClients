import { c, msgid } from 'ttag';
import { classnames } from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import humanSize from '@proton/shared/lib/helpers/humanSize';

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
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';

interface Props {
    labelID: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders: string;
    addresses: string;
    unread: boolean;
    displayRecipients: boolean;
    loading: boolean;
}

const ItemRowLayout = ({
    labelID,
    labels,
    element,
    conversationMode,
    showIcon,
    senders,
    addresses,
    unread,
    displayRecipients,
    loading,
}: Props) => {
    const { shouldHighlight, highlightMetadata, getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const useES = dbExists && esEnabled && shouldHighlight();

    const body = (element as ESMessage).decryptedBody;
    const { Subject, Size } = element;
    const size = humanSize(Size);

    const sendersContent =
        !loading && displayRecipients && !senders
            ? c('Info').t`(No Recipient)`
            : shouldHighlight()
            ? highlightMetadata(senders, unread, true).resultJSX
            : senders;
    const subjectContent = shouldHighlight() && Subject ? highlightMetadata(Subject, unread, true).resultJSX : Subject;

    let bodyContent: JSX.Element | undefined;
    let occurrencesInBody = 0;
    if (body) {
        ({ resultJSX: bodyContent, numOccurrences: occurrencesInBody } = highlightMetadata(body, unread, true));
    }
    const bodyTitle = c('Info').ngettext(
        msgid`${occurrencesInBody} occurrence found`,
        `${occurrencesInBody} occurrences found`,
        occurrencesInBody
    );

    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(element?.AttachmentInfo);

    return (
        <div className="flex-item-fluid flex flex-align-items-center flex-nowrap flex-row item-titlesender">
            <div className="mtauto mbauto flex mr0-5" data-testid={unread}>
                <ItemStar element={element} />
            </div>

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
                {conversationMode && (
                    <NumMessages
                        className={classnames(['mr0-25 flex-item-noshrink', unread && 'text-bold'])}
                        conversation={element}
                    />
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
                    {useES && (
                        <>
                            <span
                                className={classnames(['max-w100 text-ellipsis mr1', unread && 'text-bold'])}
                                title={bodyTitle}
                                aria-hidden="true"
                            >
                                {bodyContent}
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
                maxNumber={5}
                className="flex-item-noshrink mlauto"
            />

            <span className="item-weight mtauto mbauto ml1 text-right" data-testid="message-row:item-size">
                {!loading && size}
            </span>

            <span className="flex w2e ml0-5 text-center">
                <ItemAttachmentIcon
                    icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
                    element={element}
                    className="flex-item-noshrink"
                />
            </span>

            <span className="item-senddate-row w13e ml1 flex flex-nowrap flex-align-items-center flex-justify-end">
                {!!element.ExpirationTime && <ItemExpiration element={element} className="mr0-5" />}
                <ItemDate element={element} labelID={labelID} className={unread ? 'text-bold' : undefined} />
            </span>
        </div>
    );
};

export default ItemRowLayout;
