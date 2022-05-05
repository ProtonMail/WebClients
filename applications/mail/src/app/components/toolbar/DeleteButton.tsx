import { c } from 'ttag';
import { Icon, useLoading, ToolbarButton } from '@proton/components';
import { metaKey } from '@proton/shared/lib/helpers/browser';
import { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    selectedIDs: string[];
    mailSettings: MailSettings;
    onDelete: () => Promise<void>;
}

const DeleteButton = ({ onDelete, selectedIDs = [], mailSettings }: Props) => {
    const [loading, withLoading] = useLoading();
    const { Shortcuts = 0 } = mailSettings || {};

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">Backspace</kbd>
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            title={titleDelete}
            onClick={() => withLoading(onDelete())}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:deletepermanently"
            icon={<Icon name="cross-circle" alt={c('Action').t`Delete permanently`} />}
        />
    );
};

export default DeleteButton;
