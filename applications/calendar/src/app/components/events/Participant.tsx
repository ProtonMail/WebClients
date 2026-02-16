import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { normalize } from '@proton/shared/lib/helpers/string';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useUrlifyString } from '../../hooks/useUrlifyString';
import ParticipantDropdown from './ParticipantDropdown';

interface Props {
    icon: React.ReactNode;
    name: string;
    comment?: string;
    extraText?: string;
    title: string;
    initials: string;
    tooltip: string;
    className?: string;
    email: string;
    isContact: boolean;
    isCurrentUser?: boolean;
    onCreateOrEditContact: () => void;
}

const Participant = ({
    icon,
    name,
    title,
    comment,
    tooltip,
    initials,
    extraText,
    className,
    email,
    isContact,
    isCurrentUser,
    onCreateOrEditContact,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const hasEmail = !!email;
    const displayDropdown = hasEmail;
    const showEmailAddress = !isCurrentUser && hasEmail && normalize(email) !== normalize(name);
    const isRsvpNoteEnabled = useFlag('RsvpCommentWeb');

    const parsedComment = useUrlifyString({ text: comment, urlifyOptions: { target: '_blank' } });

    return (
        <div
            className={clsx([
                'participant flex flex-nowrap w-full relative interactive-pseudo interactive--no-background text-left',
                !!comment ? 'items-start' : 'items-center',
                className,
            ])}
            data-testid="participant-in-popover"
        >
            <Tooltip title={tooltip}>
                <div className="participant-display item-icon relative flex shrink-0 items-center justify-center">
                    <div className="item-abbr">{initials}</div>
                    <span className="participant-status">{icon}</span>
                </div>
            </Tooltip>
            <div className="ml-4 flex-1" title={title}>
                <div className="max-w-full participant-text text-ellipsis">{name}</div>
                {showEmailAddress ? (
                    <div className="max-w-full text-ellipsis participant-extra-text text-sm m-0">{email}</div>
                ) : null}
                {!!extraText && (
                    <div className="max-w-full text-ellipsis participant-extra-text color-weak text-sm m-0 mb-1">
                        {extraText}
                    </div>
                )}
                {isRsvpNoteEnabled && parsedComment ? (
                    <div className="max-w-full participant-extra-text color-weak text-break text-sm m-0">
                        <span dangerouslySetInnerHTML={{ __html: parsedComment }} />
                    </div>
                ) : null}
            </div>
            <Button
                shape="ghost"
                size="small"
                icon
                ref={anchorRef}
                onClick={() => {
                    toggle();
                }}
                className={clsx(['ml-1', !!comment && 'mt-1'])}
                title={c('Action').t`More options`}
            >
                <IcThreeDotsVertical alt={c('Action').t`More options`} />
            </Button>
            {displayDropdown && (
                <ParticipantDropdown
                    anchorRef={anchorRef}
                    close={close}
                    email={email}
                    isOpen={isOpen}
                    isContact={isContact}
                    onCreateOrEditContact={onCreateOrEditContact}
                />
            )}
        </div>
    );
};

export default Participant;
