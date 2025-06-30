import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldStacked, InputFieldStackedGroup, InputFieldTwo } from '@proton/components';
import { IcMeetCopy } from '@proton/icons';

import './PreJoinDetails.scss';

interface PreJoinDetailsProps {
    roomName: string;
    roomId: string;
    displayName: string;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: ({ displayName }: { displayName: string }) => void;
    shareLink: string;
}

export const PreJoinDetails = ({
    roomName,
    roomId,
    displayName,
    onDisplayNameChange,
    onJoinMeeting,
    shareLink,
}: PreJoinDetailsProps) => {
    return (
        <div className="flex flex-nowrap flex-column gap-4 w-custom" style={{ '--w-custom': '22.625rem' }}>
            <h1 className="h2 text-center">
                {roomName
                    ? c('l10n_nightly Title').t`Join ${roomName}`
                    : c('l10n_nightly Title').t`Decrypting room name...`}
            </h1>
            <p className="text-center color-weak">
                {c('l10n_nightly Info')
                    .t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`}
            </p>
            <InputFieldStackedGroup classname="mb-4 w-full">
                <InputFieldStacked isGroupElement>
                    <InputFieldTwo
                        label={c('l10n_nightly Label').t`Meeting ID`}
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={roomId || c('l10n_nightly Placeholder').t`Loading...`}
                        onChange={(e) => e.preventDefault()}
                    />
                    <Button
                        className="copy-button absolute top-custom right-custom w-custom h-custom rounded-full flex items-center justify-center border-none p-0"
                        style={{
                            '--top-custom': '50%',
                            '--right-custom': '1rem',
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                            transform: 'translateY(-50%)',
                        }}
                        onClick={() => {
                            void navigator.clipboard.writeText(shareLink);
                        }}
                        aria-label={c('l10n_nightly Alt').t`Copy meeting link`}
                    >
                        <IcMeetCopy size={4} />
                    </Button>
                </InputFieldStacked>
                <InputFieldStacked isGroupElement>
                    <InputFieldTwo
                        label={c('l10n_nightly Label').t`Your name`}
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={displayName}
                        onChange={(e) => onDisplayNameChange(e.target.value)}
                        placeholder={c('l10n_nightly Placeholder').t`Type your name`}
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <Button
                className="join-button p-5 rounded-full color-invert"
                color="norm"
                size="large"
                fullWidth
                onClick={() => onJoinMeeting({ displayName })}
                disabled={!displayName || !roomName}
            >
                {c('l10n_nightly Action').t`Ask to join`}
            </Button>
        </div>
    );
};
