import React, { forwardRef } from 'react';
import { c } from 'ttag';
import { Button, Icon } from 'react-components';
import { ConversationErrors } from '../../models/conversation';
import { hasError } from '../../helpers/errors';

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
            className="bg-danger rounded p0-5 m1 flex flex-nowrap flex-align-items-center"
            data-shortcut-target="trash-warning"
        >
            <Icon name="attention" className="mr1" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{getTranslations(errorType)}</span>
            <span className="flex-item-noshrink flex">
                <Button size="small" onClick={onRetry}>
                    {c('Action').t`Try again`}
                </Button>
            </span>
        </div>
    );
};

export default forwardRef(ConversationErrorBanner);
