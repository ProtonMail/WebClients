import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldStacked, InputFieldStackedGroup, InputFieldTwo, useNotifications } from '@proton/components';
import { IcMeetCopy } from '@proton/icons';

import './PreJoinDetails.scss';

interface PreJoinDetailsProps {
    roomName: string;
    roomId: string;
    displayName: string;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: ({ displayName }: { displayName: string }) => void;
    shareLink: string;
    instantMeeting: boolean;
}

export const PreJoinDetails = ({
    roomId,
    displayName,
    onDisplayNameChange,
    onJoinMeeting,
    shareLink,
    instantMeeting,
}: PreJoinDetailsProps) => {
    const notificationManager = useNotifications();

    const actionLabel = instantMeeting
        ? c('l10n_nightly Action').t`Start meeting`
        : c('l10n_nightly Action').t`Join meeting`;

    const title = instantMeeting
        ? c('l10n_nightly Title').t`Talk Confidentially`
        : c('l10n_nightly Title').jt`Join Meeting`;

    const getSubtitle = () => {
        if (instantMeeting) {
            return c('l10n_nightly Info')
                .t`Our end-to-end encrypted meetings protect privacy and empower truly free expression.`;
        }

        return c('l10n_nightly Info')
            .t`You've been invited to join a secure meeting. Confirm your name and click below to enter.`;
    };

    const subtitle = getSubtitle();

    return (
        <div className="flex flex-nowrap flex-column gap-4 w-custom" style={{ '--w-custom': '22.625rem' }}>
            <h1 className="h2 text-center">{title}</h1>
            <div className="text-center color-weak">{subtitle}</div>
            <InputFieldStackedGroup classname="mb-4 w-full">
                {!instantMeeting && (
                    <InputFieldStacked classname="meeting-id-field" isGroupElement>
                        <InputFieldTwo
                            label={c('l10n_nightly Label').t`Meeting ID`}
                            type="text"
                            unstyled
                            inputClassName="rounded-none"
                            value={roomId || c('l10n_nightly Placeholder').t`Loading...`}
                            onChange={(e) => e.preventDefault()}
                            readOnly
                            tabIndex={-1}
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
                                notificationManager.createNotification({
                                    type: 'info',
                                    text: c('l10n_nightly Notification').t`Copied to clipboard`,
                                    showCloseButton: false,
                                });
                            }}
                            aria-label={c('l10n_nightly Alt').t`Copy meeting link`}
                        >
                            <IcMeetCopy size={4} />
                        </Button>
                    </InputFieldStacked>
                )}

                <InputFieldStacked isGroupElement>
                    <InputFieldTwo
                        label={c('l10n_nightly Label').t`Your name`}
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={displayName}
                        onChange={(e) => onDisplayNameChange(e.target.value)}
                        placeholder={c('l10n_nightly Placeholder').t`Type your name`}
                        maxLength={64}
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <Button
                className="join-button p-5 rounded-full color-invert"
                color="norm"
                size="large"
                fullWidth
                onClick={() => onJoinMeeting({ displayName })}
                disabled={!displayName}
            >
                {actionLabel}
            </Button>
        </div>
    );
};
