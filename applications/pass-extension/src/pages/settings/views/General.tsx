import { type VFC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { vaultSetPrimaryIntent } from '@proton/pass/store/actions';
import { selectDefaultVault, selectOwnWritableVaults } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';

import { useFeatureFlag } from '../../../shared/hooks/useFeatureFlag';
import { ApplicationLogs } from '../component/ApplicationLogs';
import { Behaviors } from '../component/Behaviors';
import { Locale } from '../component/Locale';
import { SettingsPanel } from '../component/SettingsPanel';
import { VaultSetting } from '../component/VaultSetting';

export const General: VFC = () => {
    const dispatch = useDispatch();
    const primaryVaultDisabled = useFeatureFlag(PassFeature.PassRemovePrimaryVault);

    return (
        <>
            <Locale />
            {!primaryVaultDisabled && (
                <SettingsPanel title={c('Label').t`Vaults`}>
                    <VaultSetting
                        label={c('Label').t`Primary vault`}
                        optionsSelector={selectOwnWritableVaults}
                        valueSelector={selectDefaultVault}
                        onSubmit={({ shareId, content }) =>
                            dispatch(vaultSetPrimaryIntent({ id: shareId, name: content.name }))
                        }
                    />
                </SettingsPanel>
            )}
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
