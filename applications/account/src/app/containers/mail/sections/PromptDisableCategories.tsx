import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, Prompt } from '@proton/components';
import { useCategoriesToggle } from '@proton/mail/features/categoriesView/useCategoriesToggle';

export const PromptDisableCategories = (props: ModalProps) => {
    const { handleChange, loading } = useCategoriesToggle();

    return (
        <Prompt
            {...props}
            title={c('Title').t`Disable categories?`}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => handleChange({ checked: false, notification: false })}
                >{c('Action').t`Disable categories`}</Button>,
                <Button onClick={() => props.onClose?.()}>{c('Action').t`Keep categories`}</Button>,
            ]}
        >
            <p>{c('Info')
                .t`All messages will be shown in Inbox, and the category tabs and tags will no longer be visible. `}</p>
        </Prompt>
    );
};
