import { Tooltip, usePopperAnchor } from '@proton/components';
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
    onCreateOrEditContact,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const displayDropdown = !!email;

    return (
        <button
            type="button"
            ref={anchorRef}
            onClick={() => {
                toggle();
            }}
            className={clsx([
                'participant flex flex-nowrap flex-align-items-center w100 relative interactive-pseudo interactive--no-background text-left',
                className,
            ])}
        >
            <Tooltip title={tooltip}>
                <div className="participant-display item-icon relative flex flex-item-noshrink flex-align-items-center flex-justify-center">
                    <div className="item-abbr">{initials}</div>
                    <span className="participant-status">{icon}</span>
                </div>
            </Tooltip>
            <div className="ml-4 flex-item-fluid" title={title}>
                <div className="max-w100 participant-text text-ellipsis">{name}</div>
                {!!extraText && (
                    <div className="max-w100 text-ellipsis participant-extra-text color-weak text-sm m-0">
                        {extraText}
                    </div>
                )}
            </div>
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
        </button>
    );
};

export default Participant;
