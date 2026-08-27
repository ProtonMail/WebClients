import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { INVOICE_EMAIL_STATE } from '@proton/shared/lib/constants';
import type { InvoiceEmailSettings } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import useModalState from '../../../components/modalTwo/useModalState';
import { SetInvoiceEmailModal } from './SetInvoiceEmailModal';

export const useSetInvoiceEmailModal = () => {
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const [user] = useUser();
    const isEmailForInvoicesEnabled = useFlag('EmailForInvoices');
    const isEmailForInvoicesKilled = useFlag('EmailForInvoicesKillSwitch');

    // The invoice email is organization billing data, which the API only serves to admins.
    const canSetInvoiceEmail = isEmailForInvoicesEnabled && !isEmailForInvoicesKilled && user.isAdmin;

    const [organization, loadingOrganization] = useOrganization();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const invoiceEmailSettings: InvoiceEmailSettings = {
        InvoiceEmail: organization?.Settings?.InvoiceEmail ?? null,
        InvoiceEmailState: organization?.Settings?.InvoiceEmailState ?? INVOICE_EMAIL_STATE.DISABLED,
    };

    const saveInvoiceEmail = async (value: InvoiceEmailSettings): Promise<void> => {
        try {
            await api(updateOrganizationSettings(value));
            dispatch(organizationActions.updateOrganizationSettings({ value }));
            createNotification({ text: c('Success').t`Invoice email updated` });
        } catch (error) {
            throw error;
        }
    };

    return {
        setInvoiceEmailModal: renderModal && (
            <SetInvoiceEmailModal
                {...modalProps}
                initialInvoiceEmail={invoiceEmailSettings}
                onSave={saveInvoiceEmail}
            />
        ),
        openSetInvoiceEmailModal: () => setModalOpen(true),
        canSetInvoiceEmail,
        loading: loadingOrganization,
        sendEmailInvoice: invoiceEmailSettings.InvoiceEmailState !== INVOICE_EMAIL_STATE.DISABLED,
        invoiceEmailBounced: invoiceEmailSettings.InvoiceEmailState === INVOICE_EMAIL_STATE.BOUNCED,
    };
};
