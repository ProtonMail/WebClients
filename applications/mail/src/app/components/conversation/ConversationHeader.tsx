import React from 'react';
import { useLabels, classnames } from 'react-components';

import ItemStar from '../list/ItemStar';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { isConversation as testIsConversation } from '../../helpers/elements';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';

interface Props {
    className: string;
    loading: boolean;
    element: Element;
    labelID: string;
    breakpoints: Breakpoints;
}

const ConversationHeader = ({ className, loading, element, labelID, breakpoints }: Props) => {
    const [labels = []] = useLabels();

    const isConversation = testIsConversation(element);

    return (
        <header
            className={classnames([
                'border-bottom max-w100 message-conversation-summary p0-5 flex-item-noshrink',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
            data-shortcut-target="message-conversation-summary"
            data-testid="conversation-header"
        >
            <div className="flex flex-nowrap">
                <h1
                    className="message-conversation-summary-header mb0 h3 text-ellipsis-two-lines lh-rg flex-item-fluid pr1"
                    title={element.Subject}
                    data-testid="conversation-header:subject"
                >
                    {!loading ? (
                        <>
                            {isConversation && <NumMessages className="mr0-25" conversation={element} />}
                            <span>{element.Subject}</span>
                        </>
                    ) : (
                        <>&nbsp;</>
                    )}
                </h1>
                <div className="message-conversation-summary-star flex-item-noshrink pt0-25">
                    <ItemStar element={element} />
                </div>
            </div>
            {!loading && (
                <div className="flex-item-fluid text-right no-scroll">
                    <ItemLabels
                        labels={labels}
                        element={element}
                        labelID={labelID}
                        showUnlabel
                        maxNumber={breakpoints.isNarrow ? 1 : 5}
                    />
                </div>
            )}
        </header>
    );
};

export default ConversationHeader;
