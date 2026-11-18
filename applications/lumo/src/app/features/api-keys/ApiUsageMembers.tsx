import { useState } from 'react';

import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Input } from '@proton/atoms/Input/Input';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Toggle from '@proton/components/components/toggle/Toggle';
import useLoading from '@proton/hooks/useLoading';
import type { Currency } from '@proton/payments/core/interface';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ApiUsageModelStats } from './ApiUsageModelStats';
import { formatTokenCount } from './apiKeysHelpers';
import {
    type ApiMemberUsage,
    filterMembersByName,
    getApiAccessHint,
    getApiMemberUsage,
    getCostLabel,
} from './apiUsage';
import { useApiUsageMembers } from './useApiUsageMembers';
import { useMembersLumoApi } from './useMembersLumoApi';

interface MemberApiAccess {
    enabledByMemberId: Record<string, boolean>;
    hint: string | undefined;
    onChange: (memberId: string, enabled: boolean) => Promise<void>;
}

const MemberApiAccessToggle = ({ member, apiAccess }: { member: ApiMemberUsage; apiAccess: MemberApiAccess }) => {
    const [loading, withLoading] = useLoading();
    const enabled = apiAccess.enabledByMemberId[member.id];
    return (
        <div className="api-usage-member-card__access flex items-center gap-2" title={apiAccess.hint}>
            <Toggle
                id={`api-access-${member.id}`}
                checked={!!enabled}
                disabled={enabled === undefined || apiAccess.hint !== undefined}
                loading={loading}
                onChange={() => withLoading(apiAccess.onChange(member.id, !enabled))}
                aria-label={c('collider_2025: Action').t`Toggle API access for ${member.name}`}
                className="shrink-0"
            />
            <span className="api-usage-access-label">{c('collider_2025: Label').t`API access`}</span>
        </div>
    );
};

const MemberUsageCard = ({
    member,
    currency,
    apiAccess,
}: {
    member: ApiMemberUsage;
    currency: Currency;
    apiAccess: MemberApiAccess;
}) => {
    const [expanded, setExpanded] = useState(false);
    const isExpanded = expanded && member.models.length > 0;
    return (
        <article className="api-usage-member-card rounded-xl border border-weak">
            <header className="api-usage-member-card__header flex flex-wrap items-start justify-space-between gap-4 md:flex-nowrap md:items-center">
                <div className="flex items-center gap-3">
                    <span className="api-usage-member-avatar flex items-center justify-center rounded-lg">
                        {member.name.slice(0, 1)}
                    </span>
                    <span className="flex flex-column">
                        <strong>{member.name}</strong>
                        <small>{member.role}</small>
                    </span>
                </div>
                <div className="api-usage-member-card__controls flex flex-none items-start justify-space-between gap-5 w-full md:w-auto md:items-center md:justify-start">
                    <div className="api-usage-member-card__total flex flex-column items-start gap-0.5 md:items-end">
                        <small>{c('collider_2025: Label').t`Total tokens`}</small>
                        <strong>{formatTokenCount(member.totalTokens)}</strong>
                    </div>
                    <div className="api-usage-member-card__total flex flex-column items-start gap-0.5 md:items-end">
                        <small>{c('collider_2025: Label').t`Balance used`}</small>
                        <strong>{getCostLabel(member.cost, currency)}</strong>
                    </div>
                    {member.isCurrentMember && <MemberApiAccessToggle member={member} apiAccess={apiAccess} />}
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        disabled={member.models.length === 0}
                        className="api-usage-member-card__expand shrink-0"
                        aria-expanded={isExpanded}
                        aria-label={c('collider_2025: Action').t`Show usage details for ${member.name}`}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <LumoIcon name="ChevronDown" size={16} />
                    </Button>
                </div>
            </header>
            {isExpanded && (
                <div className="api-usage-models-grid mt-4">
                    {member.models.map((usage) => (
                        <ApiUsageModelStats
                            key={usage.model}
                            model={usage.model}
                            inputTokens={usage.inputTokens}
                            outputTokens={usage.outputTokens}
                            formattedCost={getCostLabel(usage.cost, currency)}
                        />
                    ))}
                </div>
            )}
        </article>
    );
};

const MemberUsageList = ({
    members,
    search,
    isLoading,
    error,
    currency,
    apiAccess,
}: {
    members: ApiMemberUsage[];
    search: string;
    isLoading: boolean;
    error: boolean;
    currency: Currency;
    apiAccess: MemberApiAccess;
}) => {
    if (isLoading) {
        return <p className="m-0 text-sm color-weak">{c('collider_2025: Info').t`Loading usage…`}</p>;
    }

    if (error) {
        return <p className="m-0 text-sm color-weak">{c('collider_2025: Error').t`Could not load usage.`}</p>;
    }

    if (members.length === 0) {
        return (
            <div className="api-usage-empty flex flex-column items-center justify-center text-center rounded-lg border border-weak bg-weak">
                <span className="api-usage-empty__icon flex items-center justify-center rounded-full mb-3">
                    <LumoIcon name="Users" size={20} />
                </span>
                <h4 className="text-sm text-bold color-norm m-0">
                    {c('collider_2025: Title').t`No member API usage yet`}
                </h4>
                <p className="text-xs color-weak m-0 mt-1">
                    {c('collider_2025: Info').t`Usage will appear here after organization members make API requests.`}
                </p>
            </div>
        );
    }

    const matchingMembers = filterMembersByName(members, search);

    return (
        <div className="api-usage-member-list">
            {matchingMembers.map((member) => (
                <MemberUsageCard key={member.id} member={member} currency={currency} apiAccess={apiAccess} />
            ))}
            {matchingMembers.length === 0 && (
                <div className="api-usage-member-list__empty rounded-xl border border-weak text-center">
                    {c('collider_2025: Info').t`No members match your search.`}
                </div>
            )}
        </div>
    );
};

export const ApiUsageMembers = ({
    from,
    to,
    periodLabel,
    currency,
}: {
    from: string | undefined;
    to: string | undefined;
    periodLabel: string;
    currency: Currency;
}) => {
    const [organizationMembers = [], isLoadingMembers] = useMembers();
    const [organization, isLoadingOrganization] = useOrganization();
    const usage = useApiUsageMembers(from, to);
    const membersLumoApi = useMembersLumoApi();
    const [search, setSearch] = useState('');
    const members = getApiMemberUsage(usage.rows, organizationMembers);
    const apiAccess = {
        enabledByMemberId: membersLumoApi.enabledByMemberId,
        hint: getApiAccessHint({
            isOrganizationApiEnabled: !!organization?.Settings.LumoApiEnabled,
            error: membersLumoApi.error,
        }),
        onChange: membersLumoApi.setApiAccess,
    };

    return (
        <div className="api-usage-members flex flex-column gap-4 w-full max-w-full min-w-0">
            <div className="api-usage-members-toolbar flex flex-column items-stretch justify-space-between gap-3 md:flex-row md:items-center">
                <div>
                    <h3 className="text-lg text-semibold color-norm m-0">{c('collider_2025: Title')
                        .t`Member usage`}</h3>
                    <p className="text-sm color-weak m-0 mt-1">
                        {c('collider_2025: Info').t`Review API spending by member for ${periodLabel}.`}
                    </p>
                </div>
                <div className="api-usage-members-actions flex items-center gap-2 w-full md:w-auto">
                    <ButtonLike as={SettingsLink} path="/users-addresses" color="weak" size="small">
                        {c('collider_2025: Action').t`Add user`}
                    </ButtonLike>
                    <Input
                        type="search"
                        value={search}
                        onValue={setSearch}
                        placeholder={c('collider_2025: Placeholder').t`Search members`}
                        aria-label={c('collider_2025: Label').t`Search members`}
                        prefix={<LumoIcon name="Search" size={15} className="color-weak" />}
                        className="api-usage-search flex-1 shrink-0 md:flex-none"
                    />
                </div>
            </div>
            <MemberUsageList
                members={members}
                search={search}
                isLoading={usage.isLoading || isLoadingMembers || isLoadingOrganization}
                error={usage.error}
                currency={currency}
                apiAccess={apiAccess}
            />
        </div>
    );
};
