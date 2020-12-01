import React from 'react';
import { c } from 'ttag';
import { useLabels, Icon, classnames } from 'react-components';

import ItemStar from '../list/ItemStar';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { isConversation as testIsConversation } from '../../helpers/elements';
import { getNumParticipants } from '../../helpers/addresses';
import { Element } from '../../models/element';
import { Conversation } from '../../models/conversation';
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
    const numParticipants = getNumParticipants(element);
    const numMessages = isConversation ? (element as Conversation).NumMessages : 1;

    return (
        <header
            className={classnames([
                'border-bottom mw100 message-conversation-summary p0-5 pb1 flex-item-noshrink',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
        >
            <div className="flex flex-nowrap mb1">
                <h1
                    className="message-conversation-summary-header mb0 h3 ellipsis-two-lines lh-standard flex-item-fluid pr1"
                    title={element.Subject}
                >
                    {!loading ? (
                        <>
                            {isConversation && (
                                <NumMessages className="is-appearing-content mr0-25" conversation={element} />
                            )}
                            <span className="is-appearing-content">{element.Subject}</span>
                        </>
                    ) : (
                        <>&nbsp;</>
                    )}
                </h1>
                <div className="message-conversation-summary-star flex-item-noshrink pt0-25">
                    <ItemStar element={element} />
                </div>
            </div>
            <div className="flex flex-nowrap">
                <div className="flex flex-items-center flex-nowrap">
                    <span className="message-conversation-summary-stat mr1 flex flex-items-center flex-item-noshrink">
                        {!loading && (
                            <span className="flex flex-items-center is-appearing-content">
                                <Icon
                                    name="email-address"
                                    className="opacity-50"
                                    alt={c('label').t`Number of messages:`}
                                />
                                <span className="ml0-25">{numMessages}</span>
                            </span>
                        )}
                    </span>
                    <span className="message-conversation-summary-stat mr1 flex flex-items-center flex-item-noshrink">
                        {!loading ? (
                            <span className="flex flex-items-center is-appearing-content">
                                <Icon
                                    name="contact"
                                    className="opacity-50"
                                    alt={c('label').t`Number of participants:`}
                                />
                                <span className="ml0-25">{numParticipants}</span>
                            </span>
                        ) : (
                            <>&nbsp;</>
                        )}
                    </span>
                </div>
                {!loading && (
                    <div className="flex-item-fluid alignright no-scroll is-appearing-content">
                        <ItemLabels
                            labels={labels}
                            element={element}
                            labelID={labelID}
                            showUnlabel
                            maxNumber={breakpoints.isNarrow ? 1 : 5}
                        />
                    </div>
                )}
            </div>
        </header>
    );
};

export default ConversationHeader;
