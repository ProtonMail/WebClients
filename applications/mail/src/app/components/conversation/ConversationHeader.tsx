import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isConversation as testIsConversation } from '../../helpers/elements';
import type { Element } from '../../models/element';
import NumMessages from './NumMessages';

interface Props {
    className?: string;
    loading: boolean;
    element?: Element;
    showBackButton?: boolean;
    onBack?: () => void;
}

const ConversationHeader = ({ className, loading, element, showBackButton = false, onBack }: Props) => {
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
                'max-w-full message-conversation-summary z-up pt-5 pb-2 px-2 mx-4 shrink-0',
                loading && 'message-conversation-summary-is-loading',
                className,
            ])}
            data-shortcut-target="message-conversation-summary"
            data-testid="conversation-header"
        >
            <div className="flex flex-nowrap">
                {showBackButton && (
                    <div className="flex items-center justify-center cursor-pointer mr-4">
                        <Icon
                            name="arrow-left"
                            alt={c('Action').t`Back`}
                            onClick={onBack}
                            data-testid="toolbar:back-button"
                        />
                    </div>
                )}
                <h1
                    className={clsx([
                        'message-conversation-summary-header my-0 h3 text-bold text-ellipsis-two-lines lh-rg flex-1',
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
