import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getInvoicesPathname } from '@proton/shared/lib/apps/helper';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props extends ModalProps {}

/**
 * This modal may be triggered by the API provider and as such it cannot use model hooks.
 */
const DelinquentModal = ({ ...props }: Props) => {
    const title = c('Delinquent modal title').t`Overdue invoice`;

    // Since delinquency state 3 and 4 were removed from the backend, this state should be in theory unreachable.
    // Keeping it here for now, but please note that this might be legacy code at this point.
    const delinquentMessage = c('Info')
        .t`Your ${BRAND_NAME} account is currently suspended. After 28 days, emails will no longer be delivered to your inbox, your Drive sharing links will be blocked, and you will not be able to upload new files. To resume normal service, please pay any overdue invoices.`;

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
            <div>{delinquentMessage}</div>
        </Prompt>
    );
};

export default DelinquentModal;
