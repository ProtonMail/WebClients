import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, Prompt, useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

export const PromptDisableCategories = (props: ModalProps) => {
    const api = useApi();

    const [loading, withLoading] = useLoading(false);
    const dispatch = useDispatch();

    const handleDisable = async () => {
        const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(false));
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));

        props.onClose?.();
    };

    return (
        <Prompt
            {...props}
            title={c('Title').t`Disable categories?`}
            buttons={[
                <Button color="norm" loading={loading} onClick={() => withLoading(handleDisable())}>{c('Action')
                    .t`Disable categories`}</Button>,
                <Button onClick={() => props.onClose?.()}>{c('Action').t`Keep categories`}</Button>,
            ]}
        >
            <p>{c('Info')
                .t`All messages will be shown in Inbox, and the category tabs and tags will no longer be visible. `}</p>
        </Prompt>
    );
};
