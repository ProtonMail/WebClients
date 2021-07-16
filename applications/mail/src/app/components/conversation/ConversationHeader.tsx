import React from 'react';
import { useLabels, classnames } from '@proton/components';

import ItemStar from '../list/ItemStar';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { isConversation as testIsConversation } from '../../helpers/elements';
import { Element } from '../../models/element';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

interface Props {
    className: string;
    loading: boolean;
    element: Element;
    labelID: string;
    highlightKeywords?: boolean;
}

const ConversationHeader = ({ className, loading, element, labelID, highlightKeywords = false }: Props) => {
    const [labels = []] = useLabels();
    const { highlightMetadata } = useEncryptedSearchContext();

    const isConversation = testIsConversation(element);
    const subjectElement =
        !!element.Subject && highlightKeywords ? (
            highlightMetadata(element.Subject, true).resultJSX
        ) : (
            <span>{element.Subject}</span>
        );

    return (
        <header
            className={classnames([
                'border-bottom max-w100 message-conversation-summary sticky-top pt1 pb0-5 pr0-5 pl0-5 ml1 mr1 flex-item-noshrink',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
            data-shortcut-target="message-conversation-summary"
            data-testid="conversation-header"
        >
            <div className="flex flex-nowrap">
                <h1
                    className="message-conversation-summary-header mb0 h3 text-bold text-ellipsis-two-lines lh-rg flex-item-fluid pr1"
                    title={element.Subject}
                    data-testid="conversation-header:subject"
                >
                    {!loading ? (
                        <>
                            {isConversation && <NumMessages className="mr0-25" conversation={element} />}
                            {subjectElement}
                        </>
                    ) : (
                        <>&nbsp;</>
                    )}
                </h1>
                <div className="message-conversation-summary-star flex-item-noshrink pt0-25">
                    <ItemStar element={element} size={22} />
                </div>
            </div>
            {!loading && (
                <div className="flex-item-fluid text-left no-scroll mt0-5">
                    <ItemLabels labels={labels} element={element} labelID={labelID} showUnlabel isCollapsed={false} />
                </div>
            )}
        </header>
    );
};

export default ConversationHeader;
