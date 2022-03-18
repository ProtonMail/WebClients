import { c } from 'ttag';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { AlertModal, AlertModalProps, Button, Href } from '../../../components';

interface Props extends Omit<AlertModalProps, 'children' | 'title' | 'buttons'> {
    onConfirm: () => void;
    type?: 'visionary';
}

const PlanLossWarningModal = ({ onConfirm, type, ...rest }: Props) => {
    const visionary = 'Visionary';
    const plan = 'visionary';
    return (
        <AlertModal
            title={c('new_plans: title').t`Switch plans?`}
            buttons={[
                <Button color="norm" onClick={rest.onClose}>
                    {type === 'visionary'
                        ? c('new_plans: action').t`Keep ${plan}`
                        : c('new_plans: action').t`Keep current plan`}
                </Button>,
                <Button
                    onClick={() => {
                        onConfirm();
                        rest.onClose?.();
                    }}
                >{c('new_plans: action').t`Switch plan`}</Button>,
            ]}
            {...rest}
        >
            {type === 'visionary' ? (
                <>
                    {c('new_plans: info')
                        .t`Our ${visionary} plan is no longer available to new subscribers as it is a special plan for original ${BRAND_NAME} users with special features and benefits. If you switch to a different plan, you lose all ${visionary} plan benefits and won’t be able to switch back to ${visionary}.`}{' '}
                    <Href url="https://proton.me/support/upgrading-to-new-proton-plan/#switch-from-visionary">{c('Info')
                        .t`Learn more`}</Href>
                </>
            ) : (
                c('new_plans: info')
                    .t`You’re enjoying a promotional price on your current plan. If you switch to a new plan or change your billing cycle, the promotional price can’t be applied and won’t be available if you switch back.`
            )}
        </AlertModal>
    );
};

export default PlanLossWarningModal;
