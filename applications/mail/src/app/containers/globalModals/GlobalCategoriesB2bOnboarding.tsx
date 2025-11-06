import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoHeader, useApi, useModalState } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { CategoriesOnboardingFlags } from 'proton-mail/components/categoryView/categoriesOnboarding/onboardingInterface';

import onboardingImage from '../../components/categoryView/categoriesOnboarding/b2bOnboardingCategories.svg';
import { useMailGlobalModals } from './GlobalModalProvider';
import { type CategoriesViewB2BOnboardingModalPayload, ModalType } from './inteface';

export const GlobalCategoriesB2bOnboarding = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [b2bModalProps, setB2BModalProps] = useState<CategoriesViewB2BOnboardingModalPayload['value'] | null>(null);

    const api = useApi();
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

        const promises = [
            api(updateMailCategoryView(enableCategories)),
            update(setBit(b2bModalProps.flagValue, CategoriesOnboardingFlags.FULL_DISPLAY)),
        ];

        await Promise.all(promises);
        modalProps.onClose?.();

        if (enableCategories) {
            window.location.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`);
        }
    };

    return (
        <>
            {shouldRender && b2bModalProps && (
                <ModalTwo {...modalProps} size="small">
                    <ModalTwoHeader
                        className="mt-2 mx-2"
                        hasClose={false}
                        title={c('Title').t`Fewer distractions, more focus`}
                    />
                    <ModalTwoContent className="m-6 lg:m-8 b2b-modal-content">
                        <img src={onboardingImage} className="categories-img" alt="" />
                        <p className="text-center color-weak mt-4 mb-12">
                            {c('Info')
                                .t`With new email categories, only important messages land in your primary inbox. Everything else is organized into categories.`}
                        </p>
                        <div className="flex justify-center mb-4">
                            <Button
                                disabled={loading}
                                color="norm"
                                className="mb-2"
                                fullWidth
                                onClick={() => withLoading(handleClick(true))}
                            >
                                {c('Action').t`Try categories`}
                            </Button>
                            <Button disabled={loading} fullWidth onClick={() => withLoading(handleClick(false))}>{c(
                                'Action'
                            ).t`Continue without categories`}</Button>
                        </div>
                        <div className="flex justify-center">
                            <Icon name="lock-filled" className="color-hint" />
                            <p className="text-sm text-center color-weak m-0 mt-1">{c('Info')
                                .t`Categories work just like spam filters. ${MAIL_APP_NAME} never reads your emails or shares your data.`}</p>
                        </div>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </>
    );
};
