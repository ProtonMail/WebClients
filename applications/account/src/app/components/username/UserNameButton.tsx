import { IcUser } from '@proton/icons/icons/IcUser';

interface Props {
    username: string | undefined;
    /** Without one, it shows the username only. */
    onClick?: () => void;
    disabled?: boolean;
}

/**
 * The username with its icon, as a button, like `UserNameWithIcon` but inline, so a long username is cut off with an
 * ellipsis rather than overflowing.
 */
export const UserNameButton = ({ username, onClick, disabled }: Props) => (
    <button onClick={onClick} disabled={disabled || !onClick} type="button" className="max-w-full text-ellipsis">
        <IcUser /> {username}
    </button>
);
