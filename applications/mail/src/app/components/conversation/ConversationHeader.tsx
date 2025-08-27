import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isElementConversation } from '../../helpers/elements';
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

    const isConversation = isElementConversation(element);
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
            <div className="flex items-center flex-nowrap">
                {showBackButton && (
                    <div className="flex items-center mr-2">
                        <Button icon shape="ghost" onClick={onBack} data-testid="toolbar:back-button">
                            <Icon name="arrow-left" alt={c('Action').t`Back`} />
                        </Button>
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
