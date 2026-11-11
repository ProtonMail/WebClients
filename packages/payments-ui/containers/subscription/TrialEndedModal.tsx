import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import { useRedirectToAccountApp } from '@proton/components/containers/desktop/useRedirectToAccountApp';
import useModals from '@proton/components/hooks/useModals';
import useLoading from '@proton/hooks/useLoading';
import { InvoiceDocument, queryInvoices } from '@proton/payments/core/api/api';
import { CYCLE, InvoiceOwner, InvoiceState } from '@proton/payments/core/constants';
import type { InvoiceResponse } from '@proton/payments/core/interface';
import { getPlanTitle, getRenewalTime } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import paymentlessIllustration from '@proton/styles/assets/img/illustrations/b2b-trial-end-paymentless.svg';
import illustration from '@proton/styles/assets/img/illustrations/b2b-trial-end.svg';
import noop from '@proton/utils/noop';

import PayInvoiceModal from '../invoices/PayInvoiceModal';

interface TrialEndedModalLayoutProps extends Omit<ModalStateProps, 'onClose'> {
    title: string;
    illustrationSrc: string;
    footer: ReactNode;
    children: ReactNode;
}

const TrialEndedModalLayout = ({ title, illustrationSrc, footer, children, ...rest }: TrialEndedModalLayoutProps) => (
    <ModalTwo size="small" className="p-3" {...rest}>
        <ModalTwoHeader title={title} titleClassName="text-center mx-auto" hasClose={false} />
        <ModalTwoContent className="flex flex-column items-center">
            <img src={illustrationSrc} alt="" />
            {children}
        </ModalTwoContent>
        <ModalTwoFooter>{footer}</ModalTwoFooter>
    </ModalTwo>
);

interface PaymentfulTrialEndedModalProps extends ModalStateProps {
    subscription: Subscription;
    planTitle: string;
}

const PaymentfulTrialEndedModal = ({ subscription, planTitle, onClose, ...rest }: PaymentfulTrialEndedModalProps) => {
    const title = c('Title').t`Your ${planTitle} subscription has started`;

    const nextBillingDate = (
        <span className="text-bold" key="next-billing-date">
            <Time>{getRenewalTime(subscription)}</Time>
        </span>
    );

    const cycle = subscription?.Cycle;

    const renewalFrequency =
        cycle === CYCLE.MONTHLY
            ? c('Info')
                  .jt`Your free trial was successfully converted to a monthly subscription. Your renewal date is ${nextBillingDate}.`
            : c('Info')
                  .jt`Your free trial was successfully converted to a ${cycle}-month subscription. Your renewal date is ${nextBillingDate}.`;

    const description = c('Info').jt`Thank you for choosing ${BRAND_NAME} to secure your organization.`;

    return (
        <TrialEndedModalLayout
            title={title}
            illustrationSrc={illustration}
            footer={<Button fullWidth onClick={onClose}>{c('Action').t`Got it`}</Button>}
            {...rest}
        >
            <span className="block mt-4">{renewalFrequency}</span>
            <span className="block mt-2">{description}</span>
        </TrialEndedModalLayout>
    );
};

interface PaymentlessTrialEndedModalProps extends ModalStateProps {
    planTitle: string;
}

const PaymentlessTrialEndedModal = ({ planTitle, onClose, ...rest }: PaymentlessTrialEndedModalProps) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const redirectToAccountApp = useRedirectToAccountApp();
    const [loading, withLoading] = useLoading();

    const openPayInvoiceModal = async () => {
        const { Invoices } = await api<InvoiceResponse>(
            queryInvoices({
                Page: 0,
                PageSize: 1,
                Owner: InvoiceOwner.User,
                State: InvoiceState.Unpaid,
                Document: InvoiceDocument.Invoice,
            })
        );
        const [unpaidInvoice] = Invoices;
        if (unpaidInvoice) {
            createModal(<PayInvoiceModal app={APP_NAME} invoice={unpaidInvoice} fetchInvoices={noop} />);
        }
    };

    const handleSubscribe = async () => {
        if (!redirectToAccountApp()) {
            await openPayInvoiceModal();
        }
        onClose();
    };

    return (
        <TrialEndedModalLayout
            title={c('Title').t`Subscribe to ${planTitle}`}
            illustrationSrc={paymentlessIllustration}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button color="norm" loading={loading} onClick={() => withLoading(handleSubscribe())}>
                        {c('Action').t`Subscribe`}
                    </Button>
                </>
            }
            {...rest}
        >
            <span className="block mt-4">
                {c('Info')
                    .t`Your free trial has ended. Subscribe now to keep your team's access uninterrupted and accounts secure.`}
            </span>
        </TrialEndedModalLayout>
    );
};

const TrialEndedModal = ({ onClose, ...rest }: ModalStateProps) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const getPaymentMethods = useGetPaymentMethods();
    const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>();

    const planTitle = getPlanTitle(subscription);
    const hasPaidSubscription = planTitle !== undefined && !!subscription && !isFreeSubscription(subscription);

    useEffect(() => {
        if (!hasPaidSubscription) {
            return;
        }

        void getPaymentMethods()
            .then((paymentMethods) => setHasPaymentMethod(paymentMethods.length > 0))
            // Close the modal so its state is reset and a retry is possible
            .catch(() => onClose());
    }, [hasPaidSubscription, getPaymentMethods, onClose]);

    if (!hasPaidSubscription || hasPaymentMethod === undefined) {
        return null;
    }

    // Handle modal closure and update user preferences
    const handleClose = async () => {
        // Update flags in user settings to indicate the trial ended modal has been acknowledged
        await api({
            url: 'core/v4/settings/flags',
            method: 'put',
            data: { DisplayTrialEndModal: 0 },
        });
        onClose();
    };

    if (hasPaymentMethod) {
        return (
            <PaymentfulTrialEndedModal
                subscription={subscription}
                planTitle={planTitle}
                onClose={handleClose}
                {...rest}
            />
        );
    }

    return <PaymentlessTrialEndedModal planTitle={planTitle} onClose={handleClose} {...rest} />;
};

export default TrialEndedModal;
