import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { useCategoriesToggle } from '@proton/mail/features/categoriesView/useCategoriesToggle';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { CategoriesOnboardingFlags } from 'proton-mail/components/categoryView/categoriesOnboarding/onboardingInterface';

import onboardingImage from '../../components/categoryView/categoriesOnboarding/b2cOnboardingCategories.svg';
import { useMailGlobalModals } from './GlobalModalProvider';
import { type CategoriesViewB2COnboardingModalPayload, ModalType } from './inteface';

import './GlobalCategoriesOnboarding.scss';

export const GlobalCategoriesB2COnboarding = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [b2cModalProps, setB2CModalProps] = useState<CategoriesViewB2COnboardingModalPayload['value'] | null>(null);

    const { sendEventOnboardingAccept, sendEventOnboardingDismiss } = useCategoriesTelemetry();

    const { handleChange } = useCategoriesToggle();
    const { update } = useFeature(FeatureCode.CategoryViewB2COnboardingViewFlags);

    const [loading, withLoading] = useLoading();

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.CategoriesViewB2COnboarding) {
                setOpen(true);
                setB2CModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen]);

    const handleClick = async (enableCategories: boolean) => {
        if (!b2cModalProps) {
            return;
        }

        await handleChange({ checked: enableCategories, notification: false });
        void update(setBit(b2cModalProps.flagValue, CategoriesOnboardingFlags.FULL_DISPLAY));

        modalProps.onClose?.();
        if (enableCategories) {
            sendEventOnboardingAccept();
        } else {
            sendEventOnboardingDismiss();
        }
    };

    return (
        <>
            {shouldRender && b2cModalProps && (
                <ModalTwo {...modalProps} size="small">
                    <ModalTwoHeader
                        className="mt-2 mx-2"
                        hasClose={false}
                        titleClassName="text-center"
                        title={c('Title').t`Your inbox, automatically organized`}
                    />
                    <ModalTwoContent className="m-6 lg:m-8 b2b-modal-content">
                        <div className="h-custom" style={{ '--h-custom': '10rem' }}>
                            <img src={onboardingImage} className="categories-img w-custom h-custom" alt="" />
                        </div>
                        <p className="text-center color-weak mt-4 mb-0">
                            {c('Info')
                                .t`${MAIL_APP_NAME} now sorts your emails into Primary, Social, Promotions, and more - so the important stuff is always front and center.`}
                        </p>
                        <div className="text-center color-weak mb-12 mt-2">
                            <span>{c('Info').t`Private by design.`}</span>{' '}
                            <Href key="learn" className="color-weak" href={getKnowledgeBaseUrl('/mail-categories')}>{c(
                                'Link'
                            ).t`Learn more.`}</Href>
                        </div>

                        <div className="flex justify-center mb-4">
                            <Button
                                disabled={loading}
                                color="norm"
                                className="mb-2"
                                fullWidth
                                onClick={() => withLoading(handleClick(true))}
                            >
                                {c('Action').t`Continue with categories`}
                            </Button>
                            <Button disabled={loading} fullWidth onClick={() => withLoading(handleClick(false))}>{c(
                                'Action'
                            ).t`Keep inbox as before`}</Button>
                        </div>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </>
    );
};
