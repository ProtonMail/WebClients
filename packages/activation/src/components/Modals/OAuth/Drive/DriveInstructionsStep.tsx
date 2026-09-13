import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { VideoInstructions } from '@proton/components/index';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../../logic/store';
import { DriveOauthTutorial } from './DriveOauthTutorial';
import { DriveStepModal } from './DriveStepModal';
import transferIntroMp4 from './illustrations/transfer-intro.mp4';
import transferIntroWebm from './illustrations/transfer-intro.webm';

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
            onClose={handleCancel}
            media={
                <VideoInstructions loop>
                    <source src={transferIntroWebm} type="video/webm" />
                    <source src={transferIntroMp4} type="video/mp4" />
                </VideoInstructions>
            }
            secondaryAction={{ label: c('Action').t`Cancel`, onClick: handleCancel }}
            primaryAction={{ label: c('Action').t`Connect`, onClick: () => setShowTutorial(true) }}
        >
            <div className="flex flex-column gap-2">
                <h3 className="text-bold">{c('Title').t`Connect your Google account`}</h3>
                <p className="color-weak mt-2 mb-0">{c('Subtitle')
                    .t`We read your files once to copy them, then encrypt each one with your ${BRAND_NAME} keys.`}</p>
            </div>
            <div className="rounded-lg mt-4">
                <InstructionRow
                    icon={<IcCheckmarkCircle size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`Read once and encrypted on arrival`}
                    subtitle={c('Info').t`Used only to copy them into ${DRIVE_APP_NAME}.`}
                    hasBorder
                />
                <InstructionRow
                    icon={<IcFileLines size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`We support most files`}
                    subtitle={c('Info').t`Won’t import photos, Google Docs and Sheets`}
                    hasBorder
                />
                <InstructionRow
                    icon={<IcEnvelopeDot size={6} className="color-primary shrink-0" />}
                    title={c('Info').t`Email you once import is finished`}
                    subtitle={c('Info').t`Sit back and we will let you know.`}
                />
            </div>
        </DriveStepModal>
    );
};
