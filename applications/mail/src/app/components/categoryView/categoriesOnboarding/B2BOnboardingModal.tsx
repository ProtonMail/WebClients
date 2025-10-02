import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader, useApi } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import onboardingImage from './b2bOnboardingCategories.svg';

import './B2BOnboardingModal.scss';

export const B2BOnboardingModal = (props: ModalProps) => {
    const api = useApi();
    const { update } = useFeature(FeatureCode.CategoryViewB2BOnboardingView);

    const [loading, withLoading] = useLoading();

    const handleClick = async (enableCategories: boolean) => {
        const promises = [api(updateMailCategoryView(enableCategories)), update(true)];

        await Promise.all(promises);
        props.onClose?.();

        if (enableCategories) {
            window.location.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`);
        }
    };

    return (
        <ModalTwo {...props} size="small">
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
                    <Button disabled={loading} fullWidth onClick={() => withLoading(handleClick(false))}>{c('Action')
                        .t`Continue without categories`}</Button>
                </div>
                <div className="flex justify-center">
                    <Icon name="lock-filled" className="color-hint" />
                    <p className="text-sm text-center color-weak m-0 mt-1">{c('Info')
                        .t`Categories work just like spam filters. ${MAIL_APP_NAME} never reads your emails or shares your data.`}</p>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
