import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { metaKey } from '@proton/shared/lib/helpers/browser';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';

interface Props {
    selectedIDs: string[];
    onDelete: (sourceAction: SOURCE_ACTION) => Promise<void>;
}

const DeleteButton = ({ onDelete, selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const { Shortcuts } = useMailModel('MailSettings');

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut="Backspace" />
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            title={titleDelete}
            onClick={() => withLoading(onDelete(SOURCE_ACTION.TOOLBAR))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:deletepermanently"
            icon={<Icon name="cross-circle" alt={c('Action').t`Delete permanently`} />}
        />
    );
};

export default DeleteButton;
