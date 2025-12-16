import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { EditCardModal } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import { InfoBanner } from './InfoBanner';

export type PublicProps = {
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    onDone?: () => void;
    onSubmit: () => void;
    hasPaymentMethod: boolean;
    app: ProductParam;
};

type Props = PublicProps & {
    userKeepsBillingCycle: boolean;
    willCreateScheduledSubscription: boolean;
};

export const AddCreditCardButton = ({
    className,
    disabled,
    loading,
    userKeepsBillingCycle,
    willCreateScheduledSubscription,
    onDone,
    onSubmit,
    app,
}: Props) => {
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();

    return (
        <>
            <Button
                color="norm"
                className={className}
                disabled={disabled}
                loading={loading}
                onClick={() => setCreditCardModalOpen(true)}
            >
                {c('Action').t`Add credit / debit card`}
            </Button>
            <InfoBanner>{c('Payments')
                .t`Payment method required for the subscription to be activated after the trial ends.`}</InfoBanner>
            {renderCreditCardModal && (
                <EditCardModal
                    app={app}
                    enableRenewToggle={false}
                    onMethodAdded={() => {
                        if (userKeepsBillingCycle) {
                            onDone?.();
                            return;
                        }

                        if (willCreateScheduledSubscription) {
                            onSubmit();
                            return;
                        }
                    }}
                    {...creditCardModalProps}
                />
            )}
        </>
    );
};
