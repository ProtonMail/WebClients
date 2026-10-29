import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { DEFAULT_AGENT_ICON } from '../../agents/constants';
import type { Skill, SubSkill } from '../../skills/types';
import type { SkillGroup } from '../skillGroups';
import { getSkillPath } from '../skillRoutes';
import { getSkillSourceLabel } from '../skillSourceLabel';
import { SkillActionsMenu } from './SkillActionsMenu';
import { SkillListRow } from './SkillListRow';

interface SkillGroupSectionProps {
    group: SkillGroup;
    onOpen: (skill: Skill) => void;
    onOpenSubSkill: (skill: Skill, subSkill: SubSkill) => void;
    onEnabledChange: (skill: Skill, enabled: boolean) => void;
    onSubSkillEnabledChange: (skill: Skill, path: string, enabled: boolean) => void;
    onEdit: (skill: Skill) => void;
    onDelete: (skill: Skill) => void;
}

const GroupHeader = ({
    id,
    title,
    count,
    meta,
    actions,
    to,
}: {
    id: string;
    title: string;
    count: number;
    meta?: string;
    actions?: ReactNode;
    /** Makes the title a link, e.g. to a plugin's overview. */
    to?: string;
}) => (
    <div className="skill-group__header flex flex-nowrap items-center gap-3">
        <div className="flex flex-nowrap items-baseline gap-2 flex-1 min-w-0">
            <h3 className="skill-group__title m-0 text-ellipsis" id={id}>
                {to ? (
                    <Link to={to} className="skill-group__title-link color-norm text-no-decoration">
                        {title}
                    </Link>
                ) : (
                    title
                )}
            </h3>
            <span className="skill-group__count shrink-0">{count}</span>
            {meta && <span className="skill-group__meta text-ellipsis">{meta}</span>}
        </div>
        {actions}
    </div>
);

export const SkillGroupSection = ({
    group,
    onOpen,
    onOpenSubSkill,
    onEnabledChange,
    onSubSkillEnabledChange,
    onEdit,
    onDelete,
}: SkillGroupSectionProps) => {
    const headingId = `skill-group-${group.key}`;

    if (group.kind === 'source') {
        return (
            <section className="skill-group" aria-labelledby={headingId}>
                <GroupHeader id={headingId} title={getSkillSourceLabel(group.source)} count={group.skills.length} />
                <ul className="m-0 p-0 list-none">
                    {group.skills.map((skill) => (
                        <SkillListRow
                            key={skill.id}
                            icon={<ProjectIcon iconId={skill.icon ?? DEFAULT_AGENT_ICON} size={16} />}
                            name={skill.name}
                            description={skill.description}
                            enabled={skill.enabled}
                            onOpen={() => onOpen(skill)}
                            onEnabledChange={(enabled) => onEnabledChange(skill, enabled)}
                            onEdit={() => onEdit(skill)}
                            onDelete={() => onDelete(skill)}
                        />
                    ))}
                </ul>
            </section>
        );
    }

    const { skill, subSkills } = group;
    const versionNumber = skill.plugin?.version;
    const author = skill.plugin?.author;
    const meta = [
        versionNumber && c('collider_2025:Info').t`v${versionNumber}`,
        author && c('collider_2025:Info').t`by ${author}`,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <section className="skill-group" aria-labelledby={headingId}>
            <GroupHeader
                id={headingId}
                title={skill.name}
                to={getSkillPath(skill.id)}
                count={skill.subSkills?.length ?? 0}
                meta={meta || undefined}
                actions={
                    <>
                        <Toggle
                            id={`${headingId}-toggle`}
                            checked={skill.enabled}
                            className="shrink-0"
                            onChange={() => onEnabledChange(skill, !skill.enabled)}
                            title={c('collider_2025:Action').t`Turn on all ${skill.name} skills`}
                        />
                        <SkillActionsMenu onEdit={() => onEdit(skill)} onDelete={() => onDelete(skill)} />
                    </>
                }
            />
            <ul className="m-0 p-0 list-none">
                {subSkills.length === 0 && (
                    <SkillListRow
                        icon={<LumoIcon name="Package" size={16} />}
                        name={skill.name}
                        description={skill.description}
                        enabled={skill.enabled}
                        onOpen={() => onOpen(skill)}
                        onEnabledChange={(enabled) => onEnabledChange(skill, enabled)}
                    />
                )}
                {subSkills.map((subSkill) => (
                    <SkillListRow
                        key={subSkill.path}
                        icon={<LumoIcon name="ScrollText" size={16} />}
                        name={subSkill.name}
                        description={subSkill.description}
                        enabled={subSkill.enabled}
                        locked={!skill.enabled}
                        onOpen={() => onOpenSubSkill(skill, subSkill)}
                        onEnabledChange={(enabled) => onSubSkillEnabledChange(skill, subSkill.path, enabled)}
                    />
                ))}
            </ul>
        </section>
    );
};
