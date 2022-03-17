import { classnames } from '@proton/components';

import NumMessages from './NumMessages';
import { isConversation as testIsConversation } from '../../helpers/elements';
import { Element } from '../../models/element';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

interface Props {
    className?: string;
    loading: boolean;
    element?: Element;
    hasScrollShadow?: boolean;
}

const ConversationHeader = ({ className, loading, element, hasScrollShadow }: Props) => {
    const { highlightMetadata, shouldHighlight } = useEncryptedSearchContext();

    const isConversation = testIsConversation(element);
    const subjectElement =
        !!element?.Subject && shouldHighlight() ? (
            highlightMetadata(element.Subject, true).resultJSX
        ) : (
            <span>{element?.Subject}</span>
        );

    return (
        <header
            className={classnames([
                'max-w100 message-conversation-summary upper-layer pt1 pb0-5 pr0-5 pl0-5 ml1 mr1 flex-item-noshrink',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
            data-shortcut-target="message-conversation-summary"
            data-testid="conversation-header"
        >
            <div className="flex flex-nowrap">
                <h1
                    className={classnames([
                        'message-conversation-summary-header mt0-25 mb0 h3 text-bold text-ellipsis-two-lines lh-rg flex-item-fluid pr1',
                        hasScrollShadow ? 'pb0-5' : 'pb0',
                    ])}
                    title={element?.Subject}
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
            </div>
        </header>
    );
};

export default ConversationHeader;
