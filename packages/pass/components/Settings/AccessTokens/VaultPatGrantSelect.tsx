import type { FC } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Checkbox from '@proton/components/components/input/Checkbox';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import clsx from '@proton/utils/clsx';

import { PAT_UI_ROLES, type PatUiGrantRole } from '../../../lib/access-token/access-token.grants';
import type { VaultShareItem } from '../../../store/reducers';
import { ShareRole } from '../../../types/data/shares';
import { VaultIcon } from '../../Vault/VaultIcon';

const PAT_ROLE_LABEL: Record<PatUiGrantRole, () => string> = {
    [ShareRole.READ]: () => c('Info').t`Viewer`,
    [ShareRole.WRITE]: () => c('Info').t`Editor`,
};

export type VaultPatGrantSelectProps = {
    vaults: VaultShareItem[];
    /** Selected vault share id → role. Manager is shown read-only. */
    grantsByShareId: ReadonlyMap<string, ShareRole>;
    onToggle: (shareId: string) => void;
    onRoleChange: (shareId: string, role: PatUiGrantRole) => void;
    maxHeight?: string;
};

export const VaultPatGrantSelect: FC<VaultPatGrantSelectProps> = ({
    vaults,
    grantsByShareId,
    onToggle,
    onRoleChange,
    maxHeight = '20rem',
}) => {
    if (vaults.length === 0) {
        return <div className="text-sm color-weak">{c('Info').t`No vaults available.`}</div>;
    }

    return (
        <div
            className={clsx('rounded border border-weak overflow-auto', maxHeight && 'max-h-custom')}
            {...(maxHeight ? { style: { '--max-h-custom': maxHeight } } : {})}
        >
            <Scroll>
                <div className="flex flex-column flex-nowrap gap-2 my-2">
                    {vaults.map((vault) => {
                        const role = grantsByShareId.get(vault.shareId);

                        return (
                            <div
                                key={vault.shareId}
                                className="flex flex-nowrap items-center gap-2 px-3 py-1 hover:bg-weak"
                            >
                                <Checkbox
                                    checked={role !== undefined}
                                    onChange={() => onToggle(vault.shareId)}
                                    className="shrink-0"
                                />
                                <VaultIcon
                                    color={vault.content.display.color}
                                    icon={vault.content.display.icon}
                                    size={3}
                                    background
                                    className="shrink-0"
                                />
                                <span className="text-ellipsis flex-1 min-w-0">{vault.content.name}</span>
                                {role === ShareRole.MANAGER && (
                                    <span
                                        className="text-sm color-weak shrink-0 max-w-custom"
                                        style={{ '--max-w-custom': '11rem' }}
                                    >
                                        {c('Info').t`Manager`}
                                    </span>
                                )}
                                {(role === ShareRole.READ || role === ShareRole.WRITE) && (
                                    <SelectTwo<PatUiGrantRole>
                                        id={`pat-vault-role-${vault.shareId}`}
                                        value={role}
                                        onValue={(value) => onRoleChange(vault.shareId, value)}
                                        className="shrink-0 max-w-custom"
                                        style={{ '--max-w-custom': '11rem' }}
                                    >
                                        {PAT_UI_ROLES.map((grantRole) => (
                                            <Option
                                                key={grantRole}
                                                value={grantRole}
                                                title={PAT_ROLE_LABEL[grantRole]()}
                                            />
                                        ))}
                                    </SelectTwo>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Scroll>
        </div>
    );
};
