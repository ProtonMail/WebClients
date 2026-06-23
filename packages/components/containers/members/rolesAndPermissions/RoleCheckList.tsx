import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Checkbox from '@proton/components/components/input/Checkbox';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

const ROLE_KNOWLEDGE_BASE_LINKS: Record<string, string> = {
    'org-admin': '/admin-roles#organizational-admin',
    'user-admin': '/admin-roles#user-admin',
    'security-admin': '/admin-roles#security-admin',
};

export interface RoleRow {
    id: string;
    name: string;
    description: string | null;
    isChecked: boolean;
    isGroupSourced: boolean;
    groupName: string | null;
}

interface Props {
    rows: RoleRow[];
    onToggle: (roleId: string) => void;
    disabled?: boolean;
}

const RoleCheckList = ({ rows, onToggle, disabled = false }: Props) => {
    return (
        <div className="flex flex-column gap-3">
            {rows.map(({ id, name, description, isChecked, isGroupSourced, groupName }) => {
                const isDisabled = disabled || isGroupSourced;
                return (
                    <div key={id} className="py-2">
                        <Checkbox
                            id={`role-${id}`}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => onToggle(id)}
                        >
                            <div className={clsx(isDisabled && 'color-disabled')}>
                                <div>
                                    {name}
                                    {isGroupSourced && (
                                        <span className="ml-1">
                                            {groupName
                                                ? c('user_modal').t`(via ${groupName})`
                                                : c('user_modal').t`(via group)`}
                                        </span>
                                    )}
                                </div>
                                <div className={clsx('text-sm', !isDisabled && 'color-weak')}>
                                    {description}
                                    {ROLE_KNOWLEDGE_BASE_LINKS[id] && (
                                        <>
                                            <br />
                                            <Href href={getKnowledgeBaseUrl(ROLE_KNOWLEDGE_BASE_LINKS[id])}>
                                                {c('Link').t`Details`}
                                            </Href>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Checkbox>
                    </div>
                );
            })}
        </div>
    );
};

export default RoleCheckList;
