import { c } from 'ttag';
import { AlertModal, AlertModalProps, Button, Href } from '../../../components';

const SubscriptionModalDisabled = (props: Omit<AlertModalProps, 'title' | 'buttons' | 'children'>) => {
    const learnMore = (
        <Href url="https://proton.me/support/upgrading-to-new-proton-plan">{c('Link').t`Learn more`}</Href>
    );
    return (
        <AlertModal
            {...props}
            title={c('new_plans: title').t`Improved plans coming soon!`}
            buttons={<Button color="norm" onClick={props.onClose}>{c('new_plans: action').t`Got it`}</Button>}
        >
            <div className="text-pre-wrap">
                {c('Info')
                    .t`We’re upgrading your current plan to an improved plan that offers more for the same price. While our systems are updating, you won’t be able to change it. We’ll email you as soon as it’s done.`}{' '}
                {learnMore}
            </div>
        </AlertModal>
    );
};

export default SubscriptionModalDisabled;
