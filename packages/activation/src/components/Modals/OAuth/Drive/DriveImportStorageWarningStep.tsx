import { c } from 'ttag';

import { useSettingsLink } from '@proton/components/index';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import image from './illustrations/illustration-proton-failed.webp';

export const DriveImportStorageWarningStep = () => {
    const dispatch = useEasySwitchDispatch();
    const settingsLink = useSettingsLink();

    const handleIgnore = () => {
        dispatch(resetOauthDraft());
    };

    const handleUpgrade = () => {
        dispatch(resetOauthDraft());
        settingsLink('/upgrade');
    };

    return (
        <DriveStepModal
            onClose={handleIgnore}
            media={<img src={image} alt="" />}
            secondaryAction={{ label: c('Action').t`Ignore`, onClick: handleIgnore }}
            primaryAction={{ label: c('Action').t`Upgrade`, onClick: handleUpgrade }}
        >
            <h3 className="text-bold">{c('Title')
                .t`Import started, but your storage won't be enough for this import`}</h3>
            <p className="color-weak mt-2 mb-0">{c('Info')
                .t`Please upgrade to ensure that the import finishes successfully.`}</p>
        </DriveStepModal>
    );
};
