import { c } from 'ttag';

import { Icon, LabelsUpsellModal, SidebarListItemHeaderLink, Tooltip, useModalState } from '@proton/components';
import { useUser } from '@proton/components/hooks';
import { APPS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit, hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import { useLabelActionsContext } from './EditLabelContext';

interface LabelsProps {
    type: 'label';
    items: Label[];
}

interface FoldersProps {
    type: 'folder';
    items: Folder[];
}

export type Props = LabelsProps | FoldersProps;

const MailSidebarListActions = ({ type, items }: Props) => {
    const [user] = useUser();
    const { createLabel } = useLabelActionsContext();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleCreate = () => {
        const canCreate = type === 'folder' ? !hasReachedFolderLimit(user, items) : !hasReachedLabelLimit(user, items);

        if (canCreate) {
            createLabel(type);
        } else {
            handleUpsellModalDisplay(true);
        }
    };

    return (
        <div className="flex items-center">
            <Tooltip title={type === 'label' ? c('Action').t`Create a new label` : c('Action').t`Create a new folder`}>
                <button
                    type="button"
                    className="flex navigation-link-header-group-control shrink-0"
                    onClick={handleCreate}
                    data-testid={type === 'label' ? 'navigation-link:add-label' : 'navigation-link:add-folder'}
                >
                    <Icon
                        name="plus"
                        alt={type === 'label' ? c('Action').t`Create a new label` : c('Action').t`Create a new folder`}
                    />
                </button>
            </Tooltip>
            <Tooltip title={type === 'label' ? c('Info').t`Manage your labels` : c('Info').t`Manage your folders`}>
                <SidebarListItemHeaderLink
                    to="/mail/folders-labels"
                    toApp={APPS.PROTONACCOUNT}
                    icon="cog-wheel"
                    alt={type === 'label' ? c('Info').t`Manage your labels` : c('Link').t`Manage your folders`}
                    target="_self"
                    data-testid="navigation-link:labels-settings"
                />
            </Tooltip>
            {renderUpsellModal && (
                <LabelsUpsellModal
                    modalProps={upsellModalProps}
                    feature={
                        type === 'label' ? MAIL_UPSELL_PATHS.UNLIMITED_LABELS : MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS
                    }
                />
            )}
        </div>
    );
};

export default MailSidebarListActions;
