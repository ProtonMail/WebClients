import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useCategoriesToggle } from '@proton/mail/features/categoriesView/useCategoriesToggle';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

export const CategoryViewToggle = () => {
    const { handleChange, state, loading } = useCategoriesToggle();
    const isReloadDisabled = useFlag('InboxDesktopCategoryViewSettingsToggleReloadDisabled');

    const handleToggle = ({ target }: ChangeEvent<HTMLInputElement>) => {
        void handleChange({ checked: target.checked, notification: true });

        // INDA-703: remove the current implementation once 1.14.0 is released
        if (isElectronApp && !isReloadDisabled) {
            void invokeInboxDesktopIPC({ type: 'userLogin' }).catch(noop);
        }
    };

    return (
        <SettingsLayout className="w-full">
            <SettingsLayoutLeft>
                <label htmlFor="toggleCategoryView" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Use email categories`}</span>
                    <Info title={c('Tooltip').t`Emails in your inbox are shown organized into categories`} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle id="toggleCategoryView" checked={state} onChange={handleToggle} loading={loading} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
