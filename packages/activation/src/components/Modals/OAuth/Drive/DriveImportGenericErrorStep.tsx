import { c } from 'ttag';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveStepModal } from './DriveStepModal';
import image from './illustrations/illustration-proton-failed.webp';

interface Props {
    message?: string;
}

export const DriveImportGenericErrorStep = ({ message }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    return (
        <DriveStepModal
            onClose={handleClose}
            media={<img src={image} alt="" />}
            primaryAction={{ label: c('Action').t`Got it`, onClick: handleClose }}
        >
            <h3 className="text-bold">{c('Title').t`Something went wrong`}</h3>
            <p className="color-weak mt-2 mb-0">
                {message ||
                    c('Info').t`An unexpected error occurred while importing your data. Please try again later.`}
            </p>
        </DriveStepModal>
    );
};
