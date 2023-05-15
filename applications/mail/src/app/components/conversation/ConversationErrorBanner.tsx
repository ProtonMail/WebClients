import { forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

import { hasError } from '../../helpers/errors';
import { ConversationErrors } from '../../logic/conversations/conversationsTypes';

const getTranslations = (key: keyof ConversationErrors) => {
    switch (key) {
        case 'network':
            return c('Error').t`Network error: Please check your connection and try again.`;
        default:
            return c('Error').t`Unknown error.`;
    }
};

interface Props {
    errors: ConversationErrors | undefined;
    onRetry: () => void;
}

const ConversationErrorBanner = ({ errors = {}, onRetry }: Props, ref: React.Ref<HTMLDivElement>) => {
    if (!hasError(errors)) {
        return null;
    }

    const errorType = (Object.keys(errors) as (keyof ConversationErrors)[]).filter((type) => errors?.[type]?.length)[0];

    return (
        <div
            ref={ref}
            tabIndex={-1}
            className="bg-danger rounded p-2 m-4 flex flex-nowrap flex-align-items-center"
            data-shortcut-target="trash-warning"
        >
            <Icon name="exclamation-circle" className="mr-4" />
            <span className="px-2 flex-item-fluid">{getTranslations(errorType)}</span>
            <span className="flex-item-noshrink flex">
                <Button size="small" onClick={onRetry} data-testid="conversation-view:error-banner-button">
                    {c('Action').t`Try again`}
                </Button>
            </span>
        </div>
    );
};

export default forwardRef(ConversationErrorBanner);
