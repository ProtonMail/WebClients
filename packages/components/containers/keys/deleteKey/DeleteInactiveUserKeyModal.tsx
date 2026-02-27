import { c } from 'ttag';

import { deleteInactiveUserKeyAction } from '@proton/account/userKeys/deleteUserKeyAction';
import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Key } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    userKey: Key;
}

export const DeleteInactiveUserKeyModal = ({ userKey, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleClose = loading ? noop : rest.onClose;
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const deleteKey = async () => {
        try {
            await dispatch(deleteInactiveUserKeyAction({ id: userKey.ID }));
            createNotification({
                text: <span>{c('Notification').jt`The key has been deleted.`}</span>,
            });
        } catch (e) {
            handleError(e);
        } finally {
            rest.onClose?.();
        }
    };

    return (
        <Prompt
            title={c('Title').t`Delete key permanently?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(deleteKey());
                    }}
                >
                    {c('Action').t`Delete permanently`}
                </Button>,
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <>
                <div className="mb-4">
                    {c('Info')
                        .t`You will NOT be able to decrypt any messages, files, and other data encrypted with this key. All data signed with this key will no longer be verified by ${BRAND_NAME} applications.`}
                </div>
                <div>
                    {c('Info')
                        .t`To avoid data loss, only delete it if you know what you’re doing or have exported a copy.`}
                </div>
            </>
        </Prompt>
    );
};
