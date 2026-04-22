import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';
import { IcPaperClip } from '@proton/icons/icons/IcPaperClip';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';

interface Props {
    onKeepPlan: () => void;
    onCancelSubscription: () => void;
}

export const ConfirmCancellationContent = ({ onKeepPlan, onCancelSubscription }: Props) => {
    const [subscription] = useSubscription();

    const endDate = subscription?.PeriodEnd
        ? format(fromUnixTime(subscription.PeriodEnd), 'PPP', { locale: dateLocale })
        : '';

    const warningItems = [
        { icon: <IcEnvelopeDot />, text: c('Confirm cancellation').t`Receive new emails` },
        { icon: <IcPaperClip />, text: c('Confirm cancellation').t`Send emails with attachments` },
        { icon: <IcCalendarGrid />, text: c('Confirm cancellation').t`Manage your calendar` },
        { icon: <IcFolderArrowUp />, text: c('Confirm cancellation').t`Upload any new files` },
        { icon: <IcArrowsRotate />, text: c('Confirm cancellation').t`Back up photos from your devices` },
    ];

    return (
        <>
            <ModalTwoHeader title={c('Confirm cancellation').t`Confirm cancellation`} />
            <ModalTwoContent>
                <p>
                    {c('Confirm cancellation')
                        .t`When your subscription ends on ${endDate}, your account will switch to the Free plan. If your usage exceeds Free plan limits, some features may be temporarily unavailable.`}{' '}
                    <Href href={getKnowledgeBaseUrl('/free-plan-limits')}>{c('Link').t`Learn more`}</Href>
                </p>

                <p className="mb-4 mt-6 text-lg text-bold">
                    {c('Confirm cancellation').t`If you exceed free plan limits, you won't be able to:`}
                </p>

                <StripedList alternate="odd" className="mt-0">
                    {warningItems.map(({ icon, text }) => {
                        return (
                            <StripedItem key={text} left={icon}>
                                {text}
                            </StripedItem>
                        );
                    })}
                </StripedList>

                <p className="color-weak mt-4">
                    {c('Confirm cancellation').t`Access is restored once usage is back within limits.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Confirm cancellation').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onCancelSubscription}>
                    {c('Confirm cancellation').t`Cancel subscription`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
