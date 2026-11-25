import { selectOauthImportStateStep } from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '../../../../logic/store';
import { EasySwitchStepModalHost } from '../../EasySwitchStepModal/EasySwitchStepModalHost';
import { DriveImportProcessModal } from './DriveImportProcessModal';
import { DriveInstructionsStep } from './DriveInstructionsStep';

interface Props {
    /** Passed by OAuthModal on the instructions step only */
    triggerOAuth?: (scopes?: string[]) => void;
    /** Passed by OAuthModal on the LoadingImporter slot; unused, each step closes through its own handler */
    onClose?: () => void;
}

/**
 * Every Drive step of the OAuth flow, in one dialog. OAuthModal keeps this component mounted while
 * it fills the slots it is used for, so the host's dialog stays open from the intro to "Import
 * started" instead of closing and reopening (with its animation) at each step.
 */
export const DriveImportFlow = ({ triggerOAuth }: Props) => {
    const step = useEasySwitchSelector(selectOauthImportStateStep);

    return (
        <EasySwitchStepModalHost>
            {step === 'instructions' && triggerOAuth ? (
                <DriveInstructionsStep triggerOAuth={triggerOAuth} />
            ) : (
                <DriveImportProcessModal />
            )}
        </EasySwitchStepModalHost>
    );
};
