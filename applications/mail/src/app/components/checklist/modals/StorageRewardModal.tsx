import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import storageUnlocked from '@proton/styles/assets/img/illustrations/checklist-storage-reward.svg';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

const StorageRewardModal = (props: ModalProps) => {
    const { isUserPaid } = useGetStartedChecklist();

    return (
        <ModalTwo {...props} size="small">
            <ModalTwoContent>
                <div className="flex items-center flex-column gap-4 text-center">
                    <img src={storageUnlocked} alt={c('Get started checklist instructions').t`Storage unlocked`} />
                    <h1 className="text-lg text-bold">
                        {isUserPaid
                            ? c('Get started checklist instructions').t`Checklist complete`
                            : c('Get started checklist instructions').t`You've unlocked 1 GB`}
                    </h1>
                    <p className="m-0">
                        {isUserPaid
                            ? c('Get started checklist instructions')
                                  .t`Keep using ${MAIL_APP_NAME} to discover more ways ${BRAND_NAME} protects your privacy and simplifies emailing.`
                            : c('Get started checklist instructions')
                                  .t`Bravo for making your email even more secure, convenient, and relevant! We've upped your free storage to a total of 1 GB.`}
                    </p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button fullWidth onClick={() => props?.onClose?.()}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default StorageRewardModal;
