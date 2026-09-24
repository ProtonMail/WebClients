import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcFileArrowIn } from '@proton/icons/icons/IcFileArrowIn';
import { IcLock } from '@proton/icons/icons/IcLock';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveOauthTutorial } from './DriveOauthTutorial';
import { DriveStepModal } from './DriveStepModal';
import { TransferLockIllustration } from './illustrations/TransferLockIllustration';

const InstructionRow = ({
    icon,
    title,
    subtitle,
    hasBorder,
}: {
    icon: ReactNode;
    title: string;
    subtitle: string;
    hasBorder?: boolean;
}) => (
    <div className={`flex items-center gap-4 py-4 ${hasBorder ? 'border-bottom border-weak' : ''}`}>
        {icon}
        <div className="flex flex-column flex-1">
            <span className="text-semibold">{title}</span>
            <span className="color-hint">{subtitle}</span>
        </div>
    </div>
);

interface Props {
    triggerOAuth: (scopes?: string[]) => void;
}

export const DriveInstructionsStep = ({ triggerOAuth }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const [showTutorial, setShowTutorial] = useState(false);

    const handleCancel = () => {
        dispatch(resetOauthDraft());
    };

    if (showTutorial) {
        return <DriveOauthTutorial triggerOAuth={triggerOAuth} />;
    }

    return (
        <DriveStepModal
            size="medium"
            onClose={handleCancel}
            media={<TransferLockIllustration />}
            secondaryAction={{ label: c('Action').t`Maybe later`, onClick: handleCancel }}
            primaryAction={{ label: c('Action').t`Continue`, onClick: () => setShowTutorial(true) }}
        >
            <div className="flex flex-column gap-2">
                <h3 className="text-bold">{c('Title').t`Easy Switch from Google Drive`}</h3>
                <p className="color-weak mt-2 mb-0">{c('Subtitle')
                    .t`Import your files and folders from Google Drive and keep them private in ${DRIVE_APP_NAME}.`}</p>
            </div>
            <div className="rounded-lg mt-4">
                <InstructionRow
                    icon={<IcFileArrowIn size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`Import your files and folders`}
                    subtitle={c('Info').t`We'll copy them from Google Drive to ${DRIVE_APP_NAME}.`}
                    hasBorder
                />
                <InstructionRow
                    icon={<IcEnvelopeDot size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`Know when it's done`}
                    subtitle={c('Info').t`We'll email you when your import is complete.`}
                    hasBorder
                />
                <InstructionRow
                    icon={<IcLock size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`Private and encrypted`}
                    subtitle={c('Info').t`Your files are encrypted and securely stored in ${DRIVE_APP_NAME}.`}
                />
            </div>
        </DriveStepModal>
    );
};
