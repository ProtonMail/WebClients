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
                title={c('new_plans: title').t`Refresh your browser`}
                buttons={
                    <Button color="norm" onClick={() => window.location.reload()}>{c('new_plans: action')
                        .t`Refresh browser`}</Button>
                }
            >
                <div className="text-pre-wrap">
                    {c('new_plans: info')
                        .t`Get the latest version of Proton and all relevant updates, such as more free storage, by refreshing your browser.`}
                </div>
            </AlertModal>
        );
    }

    return (
        <AlertModal
            {...props}
            title={c('new_plans: title').t`New plans coming soon!`}
            buttons={<Button color="norm" onClick={props.onClose}>{c('new_plans: action').t`Got it`}</Button>}
        >
            <div className="mb1">
                {c('new_plans: info')
                    .t`We’re upgrading your current plan to a new plan that offers more at no extra cost.`}
            </div>
            <div className="mb1">
                {c('new_plans: info')
                    .t`While our systems are updating, you won't be able to change your plan, but you can continue to use your Proton account without interruptions.`}
            </div>
            <div>{c('new_plans: info').t`The plan changes will be reflected in your account dashboard.`}</div>
        </AlertModal>
    );
};

export default SubscriptionModalDisabled;
