import { c } from 'ttag';

import { getTranslatedRoleName } from '@proton/account/organizationRoles/helpers';
import { Href } from '@proton/atoms/Href/Href';
import Checkbox from '@proton/components/components/input/Checkbox';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { PREDEFINED_ROLE_NAME } from '@proton/shared/lib/interfaces/OrganizationRole';
import clsx from '@proton/utils/clsx';

const ROLE_KNOWLEDGE_BASE_LINKS: Record<string, string> = {
    [PREDEFINED_ROLE_NAME.OWNER]: '/admin-roles#organizational-admin',
    [PREDEFINED_ROLE_NAME.USER_ADMIN]: '/admin-roles#user-admin',
    [PREDEFINED_ROLE_NAME.SECURITY_ADMIN]: '/admin-roles#security-admin',
};

const getFallbackDescription = (roleName: string, isGroupContext: boolean): string | null => {
    if (isGroupContext) {
        switch (roleName) {
            case PREDEFINED_ROLE_NAME.USER_ADMIN:
                return c('group_modal').t`Manage users and groups, assign roles, and allocate licenses to members.`;
            case PREDEFINED_ROLE_NAME.SECURITY_ADMIN:
                return c('group_modal').t`Manages security settings and can view all event logs and user details.`;
            default:
                return null;
        }
    }
    switch (roleName) {
        case PREDEFINED_ROLE_NAME.OWNER:
            return c('user_modal').t`Manage all users, groups, security, billing, and system configurations.`;
        case PREDEFINED_ROLE_NAME.USER_ADMIN:
            return c('user_modal').t`Manage users and groups, assign roles, and allocate licenses to members.`;
        case PREDEFINED_ROLE_NAME.SECURITY_ADMIN:
            return c('user_modal').t`Manages security settings and can view all event logs and user details.`;
        default:
            return null;
    }
};

export interface RoleRow {
    id: string;
    name: string;
    description: string | null;
    isChecked: boolean;
    isDisabled: boolean;
    badge: string | null;
}

interface Props {
    rows: RoleRow[];
    onToggle: (roleId: string) => void;
    isGroupContext?: boolean;
}

const RoleCheckList = ({ rows, onToggle, isGroupContext = false }: Props) => {
    return (
        <div className="flex flex-column gap-3">
            {rows.map(({ id, name, description, isChecked, isDisabled, badge }) => {
                const resolvedDescription = description || getFallbackDescription(name, isGroupContext);
                return (
                    <div key={id} className="flex flex-nowrap items-start gap-2 py-2">
                        <Checkbox
                            id={`role-${id}`}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => onToggle(id)}
                            className="shrink-0 mt-0.5"
                        />
                        <div className={clsx('flex-1', isDisabled && 'color-disabled')}>
                            <label htmlFor={`role-${id}`} className={clsx(!isDisabled && 'cursor-pointer')}>
                                {getTranslatedRoleName(name)}
                                {badge && <span className="ml-1">{badge}</span>}
                            </label>
                            <div className={clsx('text-sm', !isDisabled && 'color-weak')}>
                                {resolvedDescription}
                                {ROLE_KNOWLEDGE_BASE_LINKS[name] && (
                                    <>
                                        <br />
                                        <Href href={getKnowledgeBaseUrl(ROLE_KNOWLEDGE_BASE_LINKS[name])}>
                                            {c('Link').t`Details`}
                                        </Href>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RoleCheckList;
