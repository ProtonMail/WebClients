import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip, usePopperAnchor } from '@proton/components';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import ParticipantDropdown from './ParticipantDropdown';

interface Props {
    icon: React.ReactNode;
    name: string;
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

    return (
        <div
            className={clsx([
                'participant flex flex-nowrap items-center w-full relative interactive-pseudo interactive--no-background text-left',
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
                    <div className="max-w-full text-ellipsis participant-extra-text color-weak text-sm m-0">
                        {extraText}
                    </div>
                )}
            </div>
            <Button
                shape="ghost"
                size="small"
                icon
                ref={anchorRef}
                onClick={() => {
                    toggle();
                }}
                className="ml-1"
                title={c('Action').t`More options`}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
            </Button>
            {displayDropdown && (
                <ParticipantDropdown
                    anchorRef={anchorRef}
                    close={close}
                    email={email}
                    isOpen={isOpen}
                    toggle={toggle}
                    isContact={isContact}
                    onCreateOrEditContact={onCreateOrEditContact}
                />
            )}
        </div>
    );
};

export default Participant;
