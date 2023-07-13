import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    selectedLinks: DecryptedLink[];
}

const RestoreFromTrashButton = ({ selectedLinks }: Props) => {
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { restoreLinks } = useActions();

    return (
        <ToolbarButton
            disabled={restoreLoading}
            title={c('Action').t`Restore from trash`}
            icon={<Icon name="arrow-rotate-right" />}
            onClick={() => withRestoreLoading(restoreLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
