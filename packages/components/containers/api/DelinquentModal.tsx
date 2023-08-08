import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { BRAND_NAME, UNPAID_STATE } from '@proton/shared/lib/constants';

import { ModalProps, Prompt, SettingsLink } from '../../components';
import { useUser } from '../../hooks';

const DelinquentModal = (props: ModalProps) => {
    const [user] = useUser();
    const title = c('Delinquent modal title').t`Overdue invoice`;

    const delinquentMessage = c('Info')
        .t`Your ${BRAND_NAME} account is currently suspended. After 28 days, emails will no longer be delivered to your inbox, your Drive sharing links will be blocked, and you will not be able to upload new files. To resume normal service, please pay any overdue invoices.`;

    let message: string = '';
    if (user.Delinquent === UNPAID_STATE.DELINQUENT) {
        message = delinquentMessage;
    } else if (user.Delinquent === UNPAID_STATE.NO_RECEIVE) {
        message = c('Info')
            .t`Your ${BRAND_NAME} account is currently suspended. Emails are no longer being delivered to your inbox. Your Drive sharing links are no longer active, and you cannot upload new files. To continue using your account, please pay any overdue invoices.`;
    } else {
        // normally this code branch should never be reached because the DelinquentModal is displayed only when user.Delinquent >= 3 (DELINQUENT, NO_RECEIVE).
        // However if this rule will be changed in the future, then this fallback will ensure that user still has a meanigful message.
        message = delinquentMessage;
    }

    return (
        <Prompt
            title={title}
            buttons={[
                <ButtonLike color="norm" as={SettingsLink} path={getInvoicesPathname()} onClick={props.onClose}>
                    {c('Action').t`View invoice`}
                </ButtonLike>,
            ]}
            data-testid="invoice-view"
            {...props}
        >
            <div>{message}</div>
        </Prompt>
    );
};

export default DelinquentModal;
