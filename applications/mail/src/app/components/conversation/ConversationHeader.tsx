import { useMemo } from 'react';

import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isConversation as testIsConversation } from '../../helpers/elements';
import { Element } from '../../models/element';
import NumMessages from './NumMessages';

interface Props {
    className?: string;
    loading: boolean;
    element?: Element;
}

const ConversationHeader = ({ className, loading, element }: Props) => {
    const { highlightMetadata, shouldHighlight } = useEncryptedSearchContext();
    const highlightSubject = shouldHighlight();

    const isConversation = testIsConversation(element);
    const subjectElement = useMemo(
        () =>
            !!element?.Subject && highlightSubject ? (
                highlightMetadata(element.Subject, true).resultJSX
            ) : (
                <span>{element?.Subject}</span>
            ),
        [element, highlightSubject]
    );

    return (
        <header
            className={clsx([
                'max-w-full message-conversation-summary upper-layer pt-5 pb-2 px-2 mx-4 flex-item-noshrink',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
            data-shortcut-target="message-conversation-summary"
            data-testid="conversation-header"
        >
            <div className="flex flex-nowrap">
                <h1
                    className={clsx([
                        'message-conversation-summary-header my-0 h3 text-bold text-ellipsis-two-lines lh-rg flex-item-fluid',
                    ])}
                    title={element?.Subject}
                    data-testid="conversation-header:subject"
                >
                    {!loading ? (
                        <>
                            {isConversation && <NumMessages className="mr-1" conversation={element} />}
                            {subjectElement}
                        </>
                    ) : (
                        <>&nbsp;</>
                    )}
                </h1>
            </div>
        </header>
    );
};

export default ConversationHeader;
