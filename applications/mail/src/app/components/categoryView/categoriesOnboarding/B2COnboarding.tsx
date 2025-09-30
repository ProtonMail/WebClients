import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import { ButtonOnboardingPrivate } from './B2COnboardingPromptPrivate';
import { B2COnboardingFlags } from './onboardingInterface';

interface Props {
    flagValue: number;
}

export const B2COnboarding = ({ flagValue }: Props) => {
    const api = useApi();

    const { update } = useFeature(FeatureCode.CategoryViewB2COnboardingViewFlags);

    const [loadingNoCategories, withLoadingNoCategories] = useLoading();

    const handleNoCategories = async () => {
        const promises = [
            api(updateMailCategoryView(false)),
            update(setBit(flagValue, B2COnboardingFlags.FULL_DISPLAY)),
        ];

        await Promise.all(promises);

        window.location.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`);
    };

    const handleKeepCategories = () => {
        void update(setBit(flagValue, B2COnboardingFlags.FULL_DISPLAY));
    };

    const primaryCopy = getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

    return (
        <>
            <div className="m-4 p-4 bg-norm rounded-lg shadow max-w-custom" style={{ '--max-w-custom': '36.25rem' }}>
                <h2 className="text-semibold text-rg mb-2">{c('Title').t`Introducing email categories`}</h2>
                <p className="m-0 color-weak">{c('Label')
                    .t`No more missing important messages! These now show up under ${primaryCopy}. Everything else is sorted by category so they’re easy to find and don’t clutter your inbox.`}</p>
                <div className="flex gap-2 my-3">
                    <Button
                        disabled={loadingNoCategories}
                        onClick={() => {
                            handleKeepCategories();
                        }}
                        className="flex-1"
                        color="norm"
                    >{c('Action').t`Continue with categories`}</Button>
                    <Button
                        loading={loadingNoCategories}
                        onClick={() => {
                            void withLoadingNoCategories(handleNoCategories);
                        }}
                        className="flex-1"
                    >{c('Action').t`Keep inbox as before`}</Button>
                </div>
                <ButtonOnboardingPrivate />
            </div>
        </>
    );
};
