import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getSubscriptionPlanTitle } from '@proton/payments/core/subscription/helpers';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContent,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const GenericPostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { planTitle } = getSubscriptionPlanTitle(user, subscription);
    const canCloseModal = props.step === SUBSCRIPTION_STEPS.THANKS;

    return (
        <PostSubscriptionModalWrapper {...props.modalProps} canClose={canCloseModal}>
            {canCloseModal ? (
                <PostSubscriptionModalContent
                    title={c('Title').t`Upgrade complete!`}
                    description={
                        planTitle
                            ? c('Info')
                                  .t`Discover new features unlocked with ${planTitle} and start using them right away!`
                            : c('Info').t`Discover new features unlocked and start using them right away!`
                    }
                    illustration={illustration}
                    primaryButtonText={c('Button').t`Discover and set up features`}
                    primaryButtonCallback={props.onDisplayFeatureTour}
                    secondaryButtonText={c('Button').t`Remind me later`}
                    secondaryButtonCallback={props.onRemindMeLater}
                />
            ) : (
                <PostSubscriptionModalLoadingContent title={c('Info').t`Registering your subscription…`} />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default GenericPostSubscriptionModal;
