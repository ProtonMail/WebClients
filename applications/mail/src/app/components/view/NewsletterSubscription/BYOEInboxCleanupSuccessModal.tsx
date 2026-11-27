import { useContext } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import successIllustration from '@proton/styles/assets/img/illustrations/byoe-inbox-cleanup-success.svg';

import { useMailDispatch } from '../../../store/hooks';
import { SubscriptionTabs } from '../../../store/newsletterSubscriptions/interface';
import { newsletterSubscriptionsActions } from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSlice';
import { getReceivedMessagesCount } from './helper';

/**
 * One plural form can't cover both the number of mailing lists and the number of emails,
 * so with an email count the text is two translated sentences.
 */
const getUnsubscribedText = (unsubscribed: NewsletterSubscription[]) => {
    const unsubscribedCount = unsubscribed.length;
    const name = unsubscribed[0]?.Name.trim();
    const emailCount = unsubscribed.reduce((total, subscription) => {
        return total + getReceivedMessagesCount(subscription);
    }, 0);

    if (emailCount === 0) {
        if (unsubscribedCount === 1) {
            // translator: shown after unsubscribing from one mailing list that sent no emails in the last 30 days. ${name} is the sender's name, e.g. "You've unsubscribed from Dictionary.com, and past emails stay right here."
            return c('Info').t`You've unsubscribed from ${name}, and past emails stay right here.`;
        }
        // translator: shown after unsubscribing from several mailing lists that sent no emails in the last 30 days, e.g. "You've unsubscribed from 3 mailing lists, and past emails stay right here."
        return c('Info').ngettext(
            msgid`You've unsubscribed from ${unsubscribedCount} mailing list, and past emails stay right here.`,
            `You've unsubscribed from ${unsubscribedCount} mailing lists, and past emails stay right here.`,
            unsubscribedCount
        );
    }

    const unsubscribedSentence =
        unsubscribedCount === 1
            ? // translator: first sentence of "You've unsubscribed from Dictionary.com. That's about 30 fewer emails a month, and past emails stay right here." ${name} is the sender's name
              c('Info').t`You've unsubscribed from ${name}.`
            : // translator: first sentence of "You've unsubscribed from 3 mailing lists. That's about 30 fewer emails a month, and past emails stay right here."
              c('Info').ngettext(
                  msgid`You've unsubscribed from ${unsubscribedCount} mailing list.`,
                  `You've unsubscribed from ${unsubscribedCount} mailing lists.`,
                  unsubscribedCount
              );
    // translator: second sentence of "You've unsubscribed from 3 mailing lists. That's about 30 fewer emails a month, and past emails stay right here." ${emailCount} is how many emails these mailing lists sent in the last 30 days
    const emailCountSentence = c('Info').ngettext(
        msgid`That's about ${emailCount} fewer email a month, and past emails stay right here.`,
        `That's about ${emailCount} fewer emails a month, and past emails stay right here.`,
        emailCount
    );

    return `${unsubscribedSentence} ${emailCountSentence}`;
};

const SuccessTitle = () => {
    const { id } = useContext(ModalContext);

    return (
        <h1 id={id} className="text-xl text-bold mt-3 mb-0">
            {c('Title').t`Your inbox just got lighter`}
        </h1>
    );
};

interface BYOEInboxCleanupSuccessModalProps extends ModalStateProps {
    unsubscribed: NewsletterSubscription[];
}

export const BYOEInboxCleanupSuccessModal = ({ unsubscribed, ...modalProps }: BYOEInboxCleanupSuccessModalProps) => {
    const dispatch = useMailDispatch();

    const handleShowUnsubscribed = () => {
        dispatch(newsletterSubscriptionsActions.setSelectedTab(SubscriptionTabs.Unsubscribe));
        modalProps.onClose();
    };

    const unsubscribedLink = (
        <InlineLinkButton key="unsubscribed-tab-link" onClick={handleShowUnsubscribed}>
            {
                // translator: the name of the Mailing lists tab, in the sentence "Changed your mind? Find it under Unsubscribed."
                c('Link').t`Unsubscribed`
            }
        </InlineLinkButton>
    );

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoContent unstyled className="relative px-10 pt-8 text-center">
                <ModalHeaderCloseButton buttonProps={{ className: 'absolute right-0 top-0 mt-3 mr-3' }} />
                <img src={successIllustration} alt="" width={280} height={168} className="mx-auto" />
                <SuccessTitle />
                <p className="mt-3 mb-0">{getUnsubscribedText(unsubscribed)}</p>
                <p className="mt-3 mb-0 text-sm color-weak">
                    {
                        // translator: ${unsubscribedLink} is a link to the Unsubscribed tab of Mailing lists, "Changed your mind? Find it under Unsubscribed."
                        c('Info').jt`Changed your mind? Find it under ${unsubscribedLink}.`
                    }
                </p>
            </ModalTwoContent>
            <ModalTwoFooter className="pt-4 pb-5">
                {/* A single child, so the footer's space-between can't push the button to one side */}
                <div className="flex justify-center w-full">
                    <Button color="norm" onClick={modalProps.onClose}>{c('Action').t`Go to my inbox`}</Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
