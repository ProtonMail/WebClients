import { c } from 'ttag';

import { Icon, LabelsUpsellModal, SidebarListItemHeaderLink, useModalState } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { APPS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit, hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

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

    const canCreate = type === 'folder' ? !hasReachedFolderLimit(user, items) : !hasReachedLabelLimit(user, items);

    const handleCreate = () => {
        if (canCreate) {
            createLabel(type);
        } else {
            handleUpsellModalDisplay(true);
        }
    };

    return (
        <div className="flex flex-align-items-center pr0-75">
            <button
                type="button"
                className="flex navigation-link-header-group-control flex-item-noshrink"
                onClick={handleCreate}
                title={type === 'label' ? c('Action').t`Create a new label` : c('Action').t`Create a new folder`}
                data-testid={type === 'label' ? 'navigation-link:add-label' : 'navigation-link:add-folder'}
            >
                <Icon
                    name="plus"
                    alt={type === 'label' ? c('Action').t`Create a new label` : c('Action').t`Create a new folder`}
                />
            </button>
            <SidebarListItemHeaderLink
                to="/mail/folders-labels"
                toApp={APPS.PROTONACCOUNT}
                icon="cog-wheel"
                title={type === 'label' ? c('Info').t`Manage your labels` : c('Info').t`Manage your folders`}
                info={type === 'label' ? c('Info').t`Manage your labels` : c('Link').t`Manage your folders`}
                target="_self"
                data-testid="navigation-link:labels-settings"
            />

            {renderUpsellModal && (
                <LabelsUpsellModal modalProps={upsellModalProps} feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS} />
            )}
        </div>
    );
};

export default MailSidebarListActions;
