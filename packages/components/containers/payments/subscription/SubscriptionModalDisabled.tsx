import { c } from 'ttag';
import { AlertModal, AlertModalProps, Button } from '../../../components';

interface Props extends Omit<AlertModalProps, 'title' | 'buttons' | 'children'> {
    mode: 'pre-version' | 'pre-migration';
}

const SubscriptionModalDisabled = (props: Props) => {
    if (props.mode === 'pre-version') {
        return (
            <AlertModal
                {...props}
                title={c('new_plans').t`Refresh your browser`}
                buttons={
                    <Button color="norm" onClick={() => window.location.reload()}>{c('new_plans')
                        .t`Refresh browser`}</Button>
                }
            >
                <div className="text-pre-wrap">
                    {c('new_plans')
                        .t`Get the latest version of Proton and all relevant updates, such as more free storage, by refreshing your browser.`}
                </div>
            </AlertModal>
        );
    }

    return (
        <AlertModal
            {...props}
            title={c('new_plans').t`New plans coming soon!`}
            buttons={<Button color="norm" onClick={props.onClose}>{c('new_plans').t`Got it`}</Button>}
        >
            <div className="mb1">
                {c('new_plans').t`We're upgrading your current plan to a new plan that offers more for the same price.`}
            </div>
            <div>
                {c('new_plans').t`Once our system is updated, you'll see the plan changes in your account dashboard.`}
            </div>
        </AlertModal>
    );
};

export default SubscriptionModalDisabled;
