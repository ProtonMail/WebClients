import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Checkbox from '@proton/components/components/input/Checkbox';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { OrganizationRole } from '@proton/shared/lib/interfaces';

const ROLE_KNOWLEDGE_BASE_LINKS: Record<string, string> = {
    'org-admin': '/admin-roles#organizational-admin',
    'user-admin': '/admin-roles#user-admin',
    'security-admin': '/admin-roles#security-admin',
};

interface Props {
    roles: OrganizationRole[];
    selectedRoles: Set<string>;
    onChange: (selectedRoles: Set<string>) => void;
}

const RoleCheckList = ({ roles, selectedRoles, onChange }: Props) => {
    const handleRoleToggle = (roleId: string) => {
        const next = new Set(selectedRoles);
        if (next.has(roleId)) {
            next.delete(roleId);
        } else {
            next.add(roleId);
        }
        onChange(next);
    };

    return (
        <div className="flex flex-column gap-3">
            {roles.map(({ OrganizationRoleID, Name, Description }) => (
                <div key={OrganizationRoleID} className="py-2">
                    <Checkbox
                        id={`role-${OrganizationRoleID}`}
                        checked={selectedRoles.has(OrganizationRoleID)}
                        onChange={() => handleRoleToggle(OrganizationRoleID)}
                    >
                        <div>
                            <div>{Name}</div>
                            <div className="color-weak text-sm">
                                {Description}
                                {ROLE_KNOWLEDGE_BASE_LINKS[OrganizationRoleID] && (
                                    <>
                                        <br />
                                        <Href href={getKnowledgeBaseUrl(ROLE_KNOWLEDGE_BASE_LINKS[OrganizationRoleID])}>
                                            {c('Link').t`Details`}
                                        </Href>
                                    </>
                                )}
                            </div>
                        </div>
                    </Checkbox>
                </div>
            ))}
        </div>
    );
};

export default RoleCheckList;
