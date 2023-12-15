import { DefaultAccountSetting } from './DefaultAccountSetting';
import { HideAccountsSetting } from './HideAccountsSetting';

export const AccountsSettingsSubSection = () => {
    return (
        <>
            <DefaultAccountSetting />
            <HideAccountsSetting />
        </>
    );
};
