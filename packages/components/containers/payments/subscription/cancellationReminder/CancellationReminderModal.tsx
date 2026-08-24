import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { FeatureCode, useFeature } from '@proton/features';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { dateLocale } from '@proton/shared/lib/i18n';
import subscriptionEnding from '@proton/styles/assets/img/illustrations/subscription_ending.svg';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import Icon from '../../../../components/icon/Icon';
import SettingsLink from '../../../../components/link/SettingsLink';
import type { ModalProps } from '../../../../components/modalTwo/Modal';
import ModalTwo from '../../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../../components/modalTwo/ModalHeader';
import StripedItem from '../../../../components/stripedList/StripedItem';
import { StripedList } from '../../../../components/stripedList/StripedList';
import { getReminderPageConfig } from '../cancellationFlow/reminderPageConfig';
import { REACTIVATE_SOURCE } from '../cancellationFlow/useCancellationTelemetry';
import type { ReminderFlag } from './cancellationReminderHelper';
import { markRemindersAsSeen } from './cancellationReminderHelper';

const CancellationReminderModal = (props: ModalProps) => {
    const [subscription, subscriptionLoading] = useSubscription();

    const { feature, update } = useFeature<ReminderFlag>(FeatureCode.AutoDowngradeReminder);

    const scribeToLumo = useFlag(MailFeatureFlag.ScribeToLumo);

    const config = getReminderPageConfig({ subscription, scribeToLumo });

    const markAsSeen = () => {
        if (!feature?.Value || Array.isArray(feature.Value)) {
            return;
        }

        const newValue = markRemindersAsSeen(feature.Value);
        void update(newValue);
        props?.onClose?.();
    };

    if (!subscription || subscriptionLoading || isFreeSubscription(subscription)) {
        return;
    }

    const formattedEndDate = format(fromUnixTime(subscription.PeriodEnd), 'PPP', { locale: dateLocale });

    return (
        <ModalTwo {...props} onClose={markAsSeen}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <section className="flex justify-center mb-4">
                    <img src={subscriptionEnding} alt="" className="mb-4" />
                    <p className="m-0 text-2xl text-bold">{c('Cancellation reminder')
                        .t`Your subscription is ending soon`}</p>
                    <p className="m-0 color-weak">{c('Cancellation reminder')
                        .t`Reactivate by ${formattedEndDate} to keep these features:`}</p>
                </section>
                <StripedList className="my-0" alternate="odd">
                    {config?.features.features.map(({ icon, text }) => (
                        <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                            {text}
                        </StripedItem>
                    ))}
                </StripedList>
            </ModalTwoContent>
            <ModalTwoFooter>
                <ButtonLike
                    as={SettingsLink}
                    path={`/dashboard?source=${REACTIVATE_SOURCE.reminderModal}#your-subscriptions`}
                    target="_blank"
                    fullWidth
                    color="norm"
                    onClick={markAsSeen}
                >{c('Cancellation reminder').t`Reactivate subscription`}</ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancellationReminderModal;
