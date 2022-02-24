import { c } from 'ttag';
import { AlertModal, AlertModalProps, Button } from '../../../components';

type Props = Omit<AlertModalProps, 'title' | 'buttons' | 'children'>;

const SubscriptionModalDisabled = (props: Props) => {
    return (
        <AlertModal
            {...props}
            title={c('new_plans').t`New plans coming soon!`}
            buttons={<Button color="norm" onClick={props.onClose}>{c('new_plans').t`Got it`}</Button>}
        >
            <div className="text-pre-wrap">
                {c('new_plans')
                    .t`We're upgrading your current plan to a new plan that offers more storage and features for the same price.

Once our system is updated, you'll see the plan changes in your account dashboard.`}
            </div>
        </AlertModal>
    );
};

export default SubscriptionModalDisabled;
