import { useState } from 'react';

import { c } from 'ttag';

import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcFileArrowIn } from '@proton/icons/icons/IcFileArrowIn';
import { IcLock } from '@proton/icons/icons/IcLock';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateHasReadInstructions } from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { EasySwitchStepFeatureList } from '../../EasySwitchStepModal/EasySwitchStepFeatureList';
import { EasySwitchStepModal } from '../../EasySwitchStepModal/EasySwitchStepModal';
import { DriveOauthTutorial } from './DriveOauthTutorial';
import { DRIVE_IMPORT_STEPS } from './driveImportSteps';
import { TransferLockIllustration } from './illustrations/TransferLockIllustration';

interface Props {
    triggerOAuth: (scopes?: string[]) => void;
}

export const DriveInstructionsStep = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const hasReadInstructions = useEasySwitchSelector(selectOauthImportStateHasReadInstructions);
    const [showTutorial, setShowTutorial] = useState(!!hasReadInstructions);

    const handleCancel = () => {
        dispatch(resetOauthDraft());
    };

    if (showTutorial) {
        return <DriveOauthTutorial triggerOAuth={triggerOAuth} />;
    }

    return (
        <EasySwitchStepModal
            step={DRIVE_IMPORT_STEPS.intro}
            onClose={handleCancel}
            media={<TransferLockIllustration />}
            secondaryAction={{ label: c('Action').t`Maybe later`, onClick: handleCancel }}
            primaryAction={{ label: c('Action').t`Continue`, onClick: () => setShowTutorial(true) }}
            title={c('Title').t`Easy Switch from Google Drive`}
        >
            <EasySwitchStepFeatureList
                className="mt-2"
                items={[
                    {
                        icon: <IcFileArrowIn />,
                        title: c('Info').t`Import your files and folders`,
                        description: c('Info').t`We'll copy them from Google Drive to ${DRIVE_APP_NAME}.`,
                    },
                    {
                        icon: <IcEnvelopeDot />,
                        title: c('Info').t`Know when it's done`,
                        description: c('Info').t`We'll email you when your import is complete.`,
                    },
                    {
                        icon: <IcLock />,
                        title: c('Info').t`Private and encrypted`,
                        description: c('Info').t`Your files are encrypted and securely stored in ${DRIVE_APP_NAME}.`,
                    },
                ]}
            />
        </EasySwitchStepModal>
    );
};
