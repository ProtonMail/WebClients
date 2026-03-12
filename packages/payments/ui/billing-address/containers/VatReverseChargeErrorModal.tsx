import type { ElementType } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { getInvoicesPathname } from '@proton/components/containers/invoices/helpers';

export interface VatReverseChargeErrorModalInputs {
    onCancel?: () => void;
    onEditAddress?: () => void;
    disableSpaNavigation?: boolean;
}

export type VatReverseChargeErrorModalProps = ModalProps & VatReverseChargeErrorModalInputs;

export const VatReverseChargeErrorModal = (props: VatReverseChargeErrorModalProps) => {
    const { onCancel, onEditAddress, disableSpaNavigation, ...rest } = props;

    const editBillingAddressActionName = c('Action').t`Edit billing address`;
    const editBillingAddressProps = disableSpaNavigation
        ? // SettingsLink is not fully reliable when redirecting from V2 signup page to account dashboard
          { as: 'a' as ElementType, href: getInvoicesPathname(), children: editBillingAddressActionName }
        : { as: SettingsLink, path: getInvoicesPathname(), children: editBillingAddressActionName };

    return (
        <ModalTwo size="small" disableCloseOnEscape {...rest}>
            <ModalTwoHeader title={c('Title').t`Reverse charge not supported`} hasClose={false} />
            <ModalTwoContent>
                <p>{c('Info')
                    .t`Your account is currently configured to apply the reverse charge scheme. This is not supported for the selected plan. To proceed, either remove the VAT number from the billing address or select a different plan.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    onClick={() => {
                        onCancel?.();
                        rest.onClose?.();
                    }}
                >
                    {c('Action').t`Close`}
                </Button>
                <ButtonLike color="norm" onClick={onEditAddress} {...editBillingAddressProps} />
            </ModalTwoFooter>
        </ModalTwo>
    );
};
