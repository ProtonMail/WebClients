import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const RestoreFromTrashButton = ({ shareId, selectedLinks }: Props) => {
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { restoreLinks } = useActions();

    return (
        <ToolbarButton
            disabled={restoreLoading}
            title={c('Action').t`Restore from trash`}
            icon={<Icon name="arrow-rotate-right" />}
            onClick={() => withRestoreLoading(restoreLinks(new AbortController().signal, shareId, selectedLinks))}
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
