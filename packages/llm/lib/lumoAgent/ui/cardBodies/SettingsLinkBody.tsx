import SettingsLink from '@proton/components/components/link/SettingsLink';

interface Props {
    /** Resolved against the current app's settings section, e.g. `/auto-reply` → `/mail/auto-reply`. */
    path: string;
    label: string;
}

/**
 * The "the rest is in settings" row on a confirm card, so the assistant never has to offer advanced
 * options in prose. A new tab, so confirming the card does not lose the chat.
 */
const SettingsLinkBody = ({ path, label }: Props) => (
    <SettingsLink path={path} target="_blank" rel="noopener noreferrer" className="text-sm">
        {label}
    </SettingsLink>
);

export default SettingsLinkBody;
