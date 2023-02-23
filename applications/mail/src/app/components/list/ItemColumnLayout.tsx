import { ReactNode, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { classnames } from '@proton/components';
import { useUserSettings } from '@proton/components/hooks/';
import { DENSITY } from '@proton/shared/lib/constants';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { getHasOnlyIcsAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { getLabelIDs, isStarred as testIsStarred } from '../../helpers/elements';
import { useExpiringElement } from '../../hooks/useExpiration';
import { Element } from '../../models/element';
import { ESMessage } from '../../models/encryptedSearch';
import { Breakpoints } from '../../models/utils';
import NumMessages from '../conversation/NumMessages';
import ItemAction from './ItemAction';
import ItemAttachmentIcon from './ItemAttachmentIcon';
import ItemDate from './ItemDate';
import ItemExpiration from './ItemExpiration';
import ItemHoverButtons from './ItemHoverButtons';
import ItemLabels from './ItemLabels';
import ItemLocation from './ItemLocation';
import ItemStar from './ItemStar';
import ItemUnread from './ItemUnread';

interface Props {
    labelID: string;
    elementID?: string;
    labels?: Label[];
    element: Element;
    conversationMode: boolean;
    showIcon: boolean;
    senders: ReactNode;
    breakpoints: Breakpoints;
    unread: boolean;
    onBack: () => void;
    isSelected: boolean;
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
    onBack,
    isSelected,
    senders,
}: Props) => {
    const [userSettings] = useUserSettings();
    const { shouldHighlight, highlightMetadata } = useEncryptedSearchContext();
    const highlightData = shouldHighlight();

    const { expirationTime, hasExpiration } = useExpiringElement(element, conversationMode);

    const body = (element as ESMessage).decryptedBody;
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
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    return (
        <div
            className="flex-item-fluid flex flex-nowrap flex-column flex-justify-center item-titlesender pr0-25"
            data-testid="message-list:message"
        >
            <div className="flex flex-align-items-center flex-nowrap">
                <div className="flex-item-fluid">
                    <div className="flex flex-align-items-center item-firstline">
                        <div className="item-senders flex-item-fluid flex flex-nowrap pr1">
                            <ItemUnread
                                element={element}
                                labelID={labelID}
                                className={clsx('item-unread-dot flex-item-noshrink', isCompactView && 'mr0-25')}
                                isSelected={isSelected}
                            />
                            <ItemAction element={element} className="mr0-25 myauto flex-item-noshrink" />
                            <span
                                className="inline-block max-w100 text-ellipsis"
                                data-testid="message-column:sender-address"
                            >
                                {senders}
                            </span>
                        </div>

                        <span className="item-firstline-infos flex-item-noshrink flex flex-nowrap flex-align-items-center">
                            <ItemDate
                                element={element}
                                labelID={labelID}
                                className="item-senddate-col text-sm"
                                useTooltip
                            />
                        </span>
                    </div>

                    <div className="flex flex-nowrap flex-align-items-center item-secondline max-w100">
                        <div className="item-subject flex-item-fluid flex flex-nowrap flex-align-items-center">
                            {showIcon && (
                                <span className="flex flex-item-noshrink">
                                    <ItemLocation element={element} labelID={labelID} />
                                </span>
                            )}
                            {conversationMode && (
                                <NumMessages className="mr0-25 flex-item-noshrink" conversation={element} />
                            )}
                            <span
                                role="heading"
                                aria-level={2}
                                className="inline-block max-w100 mr0-25 text-ellipsis"
                                title={Subject}
                                data-testid="message-column:subject"
                            >
                                {subjectContent}
                            </span>
                        </div>

                        <div className="item-icons flex flex-item-noshrink flex-nowrap no-mobile">
                            <span className="flex item-meta-infos">
                                {hasLabels && isCompactView && (
                                    <ItemLabels
                                        className="ml0-5"
                                        labels={labels}
                                        element={element}
                                        labelID={labelID}
                                        maxNumber={1}
                                    />
                                )}
                                {hasExpiration && (
                                    <ItemExpiration
                                        expirationTime={expirationTime}
                                        className="ml0-25 flex-align-self-center"
                                    />
                                )}
                                <ItemAttachmentIcon
                                    icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                    element={element}
                                    className="ml0-25 flex-align-self-center"
                                />
                                <span className="ml0-25 flex-flex-children flex-item-centered-vert hidden-empty">
                                    {isStarred && <ItemStar element={element} />}
                                </span>
                            </span>
                        </div>
                        <div className="item-icons flex flex-row flex-item-noshrink flex-nowrap no-desktop no-tablet on-mobile-flex">
                            {hasExpiration && (
                                <ItemExpiration
                                    expirationTime={expirationTime}
                                    className="ml0-25 flex-align-self-center"
                                />
                            )}
                            <ItemAttachmentIcon
                                icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                element={element}
                                className="ml0-25 flex-align-self-center"
                            />
                            <span className="ml0-25 flex-flex-children flex-item-centered-vert hidden-empty">
                                <ItemStar element={element} />
                            </span>
                        </div>
                    </div>
                </div>
                <ItemHoverButtons element={element} labelID={labelID} elementID={elementID} onBack={onBack} />
            </div>

            {hasLabels && !isCompactView && (
                <div className="flex flex-nowrap flex-align-items-center max-w100 no-scroll">
                    <div className="item-icons flex flex-item-noshrink flex-nowrap mt0-25">
                        <ItemLabels
                            className="ml0-5"
                            labels={labels}
                            element={element}
                            labelID={labelID}
                            maxNumber={breakpoints.isNarrow ? 1 : 5}
                            isCollapsed={false}
                        />
                    </div>
                </div>
            )}

            {!!resultJSX && (
                <>
                    <div
                        className={classnames([
                            'flex flex-nowrap flex-align-items-center item-secondline item-es-result max-w80 no-scroll',
                            isCompactView && 'mb0-75',
                        ])}
                        aria-hidden="true"
                    >
                        <div className="item-subject flex-item-fluid flex flex-nowrap flex-align-items-center">
                            <span className="inline-block max-w100 text-ellipsis" title={bodyTitle}>
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
