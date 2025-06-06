import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldStacked, InputFieldStackedGroup, InputFieldTwo } from '@proton/components';
import { IcMeetCopy } from '@proton/icons';

import { getMeetingLink } from '../../utils/getMeetingLink';

import './PreJoinDetails.scss';

interface PreJoinDetailsProps {
    roomId: string;
    displayName: string;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: ({ displayName }: { displayName: string }) => void;
}

export const PreJoinDetails = ({ roomId, displayName, onDisplayNameChange, onJoinMeeting }: PreJoinDetailsProps) => {
    return (
        <div className="flex flex-nowrap flex-column gap-4 w-custom" style={{ '--w-custom': '22.625rem' }}>
            <h1 className="h2 text-center">{c('l10n_nightly Title').t`Talk freely`}</h1>
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
                        value={roomId}
                        onChange={(e) => e.preventDefault()}
                    />
                    <Button
                        className="absolute top-custom right-custom w-custom h-custom bg-norm color-norm rounded-full flex items-center justify-center border-none p-0"
                        style={{
                            '--top-custom': '50%',
                            '--right-custom': '1rem',
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                            transform: 'translateY(-50%)',
                        }}
                        onClick={() => {
                            void navigator.clipboard.writeText(getMeetingLink(roomId));
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
                className="p-5 rounded-full color-invert"
                color="norm"
                size="large"
                fullWidth
                onClick={() => onJoinMeeting({ displayName })}
                disabled={!displayName}
            >
                {c('l10n_nightly Action').t`Ask to join`}
            </Button>
        </div>
    );
};
