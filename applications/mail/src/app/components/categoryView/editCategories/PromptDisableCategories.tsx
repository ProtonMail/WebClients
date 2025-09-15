import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalProps, Prompt, useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

export const PromptDisableCategories = (props: ModalProps) => {
    const api = useApi();

    const [loading, withLoading] = useLoading(false);

    const handleDisable = async () => {
        await withLoading(api(updateMailCategoryView(false)));
        window.location.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`);
    };

    return (
        <Prompt
            {...props}
            title={c('Title').t`Disable categories?`}
            buttons={[
                <Button color="norm" loading={loading} onClick={handleDisable}>{c('Action')
                    .t`Disable categories`}</Button>,
                <Button onClick={() => props.onClose?.()}>{c('Action').t`Keep categories`}</Button>,
            ]}
        >
            <p>{c('Info')
                .t`All messages will be shown in Inbox, and the category tabs and tags will no longer be visible. `}</p>
        </Prompt>
    );
};
