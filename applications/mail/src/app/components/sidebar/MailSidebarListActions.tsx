import { c } from 'ttag';

import { Icon, SidebarListItemHeaderLink } from '@proton/components/components';
import { APPS } from '@proton/shared/lib/constants';

import { useLabelActionsContext } from './EditLabelContext';

interface Props {
    type: 'folder' | 'label';
}

const MailSidebarListActions = ({ type }: Props) => {
    const { createLabel } = useLabelActionsContext();

    return (
        <div className="flex flex-align-items-center pr0-75">
            <button
                type="button"
                className="flex navigation-link-header-group-control flex-item-noshrink"
                onClick={() => createLabel(type)}
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
        </div>
    );
};

export default MailSidebarListActions;
