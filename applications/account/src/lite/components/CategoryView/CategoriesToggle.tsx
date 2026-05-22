import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import MobileSection from '../MobileSection';
import MobileSectionLabel from '../MobileSectionLabel';
import MobileSectionRow from '../MobileSectionRow';

export const CategoriesToggle = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const [mailSettings] = useMailSettings();

    const { createNotification } = useNotifications();
    const [toggleCategory, withLoading] = useLoading();
    const { state, toggle } = useToggle(mailSettings.MailCategoryView);

    const handleToggle = async (checked: boolean) => {
        const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(checked));
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
        createNotification({ text: c('Success').t`Preference saved` });

        toggle();
    };

    return (
        <MobileSection>
            <MobileSectionRow>
                <MobileSectionLabel htmlFor="category-view">{c('Label').t`Enable categories`}</MobileSectionLabel>
                <Toggle
                    id="category-view"
                    checked={state}
                    onChange={({ target }) => withLoading(handleToggle(target.checked))}
                    loading={toggleCategory}
                />
            </MobileSectionRow>
        </MobileSection>
    );
};
