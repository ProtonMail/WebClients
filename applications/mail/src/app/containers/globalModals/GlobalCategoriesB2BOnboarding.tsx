import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';
import { CategoriesOnboardingFlags } from '@proton/mail/features/categoriesView/categoriesOnboarding';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { useCategoriesToggle } from '@proton/mail/features/categoriesView/useCategoriesToggle';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';

import onboardingImage from '../../components/categoryView/categoriesOnboarding/onboardingCategories.svg';
import { useMailGlobalModals } from './globalModalContext';
import { type CategoriesViewB2BOnboardingModalPayload, ModalType } from './inteface';

import './GlobalCategoriesOnboarding.scss';

export const GlobalCategoriesB2BOnboarding = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [b2bModalProps, setB2BModalProps] = useState<CategoriesViewB2BOnboardingModalPayload['value'] | null>(null);

    const { sendEventOnboardingAccept, sendEventOnboardingDismiss } = useCategoriesTelemetry();

    const { handleChange } = useCategoriesToggle();
    const { update } = useFeature(FeatureCode.CategoryViewB2BOnboardingViewFlags);

    const [loading, withLoading] = useLoading();

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.CategoriesViewB2BOnboarding) {
                setOpen(true);
                setB2BModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen]);

    const handleClick = async (enableCategories: boolean) => {
        if (!b2bModalProps) {
            return;
        }

        await handleChange({ checked: enableCategories, notification: false });
        void update(setBit(b2bModalProps.flagValue, CategoriesOnboardingFlags.INITIAL_MODAL));

        modalProps.onClose?.();
        if (enableCategories) {
            sendEventOnboardingAccept();
        } else {
            sendEventOnboardingDismiss();
        }
    };

    return (
        <>
            {shouldRender && b2bModalProps && (
                <ModalTwo {...modalProps} size="small" disableCloseOnEscape>
                    <ModalTwoHeader
                        className="mt-2 mx-2"
                        titleClassName="text-center"
                        hasClose={false}
                        title={c('Title').t`Fewer distractions, more focus`}
                    />
                    <ModalTwoContent className="m-6 lg:m-8 b2b-modal-content">
                        <div className="h-custom" style={{ '--h-custom': '10rem' }}>
                            <img src={onboardingImage} className="categories-img w-custom h-custom" alt="" />
                        </div>
                        <p className="text-center color-weak mt-4 mb-12">
                            {c('Info')
                                .t`With new email categories, only important messages land in your primary inbox. Everything else is organized into categories.`}
                        </p>
                        <div className="flex justify-center">
                            <IcLockFilled className="color-hint" />
                            <p className="text-sm text-center color-weak m-0 mt-1">{c('Info')
                                .t`Categories work just like spam filters. ${MAIL_APP_NAME} never reads your emails or shares your data.`}</p>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex-column">
                        <Button
                            disabled={loading}
                            color="norm"
                            fullWidth
                            onClick={() => withLoading(handleClick(true))}
                        >
                            {c('Action').t`Try categories`}
                        </Button>
                        <Button disabled={loading} fullWidth onClick={() => withLoading(handleClick(false))}>{c(
                            'Action'
                        ).t`Continue without categories`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};
