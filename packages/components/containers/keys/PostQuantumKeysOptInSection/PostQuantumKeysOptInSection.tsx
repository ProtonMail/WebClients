import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { Button } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PostQuantumOptInModal from './PostQuantumOptInModal';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
const PostQuantumKeysOptInSection = () => {
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const [optInModal, showOptInModal] = useModalTwoStatic(PostQuantumOptInModal);

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
        <>
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info')
                        .t`By enabling post-quantum protection, keys that are resistant against quantum computers will be generated for your account.`}
                </SettingsParagraph>
                {
                    <div className="mb-4">
                        <Button
                            shape="outline"
                            onClick={() => showOptInModal({})}
                            data-testid="postQuantumOptIn"
                        >
                            {c('Action').t`Enable post-quantum protection`}
                        </Button>
                    </div>
                }
            </SettingsSectionWide>
            {optInModal}
        </>
    );
};

export default PostQuantumKeysOptInSection;
