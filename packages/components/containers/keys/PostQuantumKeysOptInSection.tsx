import { c } from 'ttag';

import { useUserSettings, userSettingsActions } from '@proton/account';
import { Button } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const PostQuantumKeysOptInSection = () => {
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const dispatch = useDispatch();
    const api = useApi();
    const [loading, withLoading, setLoading] = useLoading();

    const handleOptIn = async () => {
        setLoading(true);
        const updatedFlagSupportPgpV6Keys = { SupportPgpV6Keys: 1 as const };
        await api(updateFlags(updatedFlagSupportPgpV6Keys)).finally(() => {
            setLoading(false);
        });
        // optimistically update user settings without waiting for event loop;
        // this is done only after awaiting the API response since it will fail if the action is not authorized.
        dispatch(
            userSettingsActions.update({
                UserSettings: { Flags: { ...userSettings.Flags, ...updatedFlagSupportPgpV6Keys } },
            })
        );

        // TODO: automatically generate v6 account & address keys
    };

    if (!!userSettings.Flags.SupportPgpV6Keys) {
        return (
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info').t`Support for post-quantum keys is enabled for your account.`}
                </SettingsParagraph>
            </SettingsSectionWide>
        );
    }

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`By enabling post-quantum protection, keys that are resistant against quantum computers will be generated for your account.
                Note that after the upgrade, you will no longer be able to login from older versions of ${BRAND_NAME} mobile apps.`}
            </SettingsParagraph>
            {
                <div className="mb-4">
                    <Button
                        shape="outline"
                        onClick={() => withLoading(handleOptIn)}
                        loading={loading}
                        data-testid="postQuantumOptIn"
                    >
                        {c('Action').t`Enable post-quantum protection`}
                    </Button>
                </div>
            }
        </SettingsSectionWide>
    );
};

export default PostQuantumKeysOptInSection;
