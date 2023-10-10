import { type VFC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { selectDefaultVault, selectOwnWritableVaults, vaultSetPrimaryIntent } from '@proton/pass/store';
import { PassFeature } from '@proton/pass/types/api/features';

import { useFeatureFlag } from '../../../shared/hooks/useFeatureFlag';
import { ApplicationLogs } from '../component/ApplicationLogs';
import { Behaviors } from '../component/Behaviors';
import { Locale } from '../component/Locale';
import { VaultSetting } from '../component/VaultSetting';

export const General: VFC = () => {
    const dispatch = useDispatch();
    const primaryVaultDisabled = useFeatureFlag(PassFeature.PassRemovePrimaryVault);

    return (
        <>
            {ENV === 'development' && <Locale />}
            {!primaryVaultDisabled && (
                <VaultSetting
                    label={c('Label').t`Primary vault`}
                    optionsSelector={selectOwnWritableVaults}
                    valueSelector={selectDefaultVault}
                    onSubmit={({ shareId, content }) =>
                        dispatch(vaultSetPrimaryIntent({ id: shareId, name: content.name }))
                    }
                />
            )}
            <Behaviors />
            <ApplicationLogs />
        </>
    );
};
