import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import passAccess from '../../../../../single-signup-v2/pass/access.svg';

interface Props extends ModalProps {
    onContinue: () => void;
    onSignOut: () => Promise<void>;
}

export const AccessModal = ({ onClose, onContinue, onSignOut, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();

    // Reuse same string as in applications/account/src/app/single-signup-v2/modals/AccessModal.tsx
    const plan = PASS_SHORT_APP_NAME;

    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoContent>
                <div className="text-center">
                    <img src={passAccess} alt="" className="mb-4 mt-4" />
                    <h1 className="mb-4 text-bold h3">{c('pass_signup_2023: Info').t`Welcome to ${plan}`}</h1>
                    <div className="mb-6 color-weak">{c('pass_signup_2023: Info')
                        .t`You already have a ${BRAND_NAME} account and can start using ${PASS_APP_NAME} right away.`}</div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    shape="ghost"
                    color="norm"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(onSignOut().then(() => onClose?.()));
                    }}
                    fullWidth
                >
                    {c('pass_signup_2023: Action').t`Create another account instead`}
                </Button>
                <Button
                    color="norm"
                    onClick={() => {
                        onContinue();
                        onClose?.();
                    }}
                    fullWidth
                >
                    {c('pass_signup_2023: Action').t`Open ${PASS_APP_NAME} vaults`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
