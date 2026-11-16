import { useId, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { DEFAULT_AGENT_ICON } from '../../agents/constants';
import type { Skill, SubSkill } from '../../skills/types';
import type { SkillGroup } from '../skillGroups';
import { getSkillSourceLabel } from '../skillSourceLabel';
import { SkillListRow } from './SkillListRow';

interface SkillGroupRowsProps {
    group: SkillGroup;
    onOpen: (skill: Skill) => void;
    onOpenSubSkill: (skill: Skill, subSkill: SubSkill) => void;
    onEnabledChange: (skill: Skill, enabled: boolean) => void;
    onSubSkillEnabledChange: (skill: Skill, path: string, enabled: boolean) => void;
    onEdit: (skill: Skill) => void;
    onDelete: (skill: Skill) => void;
}

const getSkillSetMeta = (skill: Skill) => {
    const skillCount = skill.subSkills?.length ?? 0;
    const author = skill.plugin?.author;
    const skills = c('collider_2025:Info').ngettext(msgid`${skillCount} skill`, `${skillCount} skills`, skillCount);
    return author
        ? c('collider_2025:Info').t`Skill set · ${skills} · by ${author}`
        : c('collider_2025:Info').t`Skill set · ${skills}`;
};

const SkillSetRow = ({
    group,
    onOpen,
    onOpenSubSkill,
    onEnabledChange,
    onSubSkillEnabledChange,
    onEdit,
    onDelete,
}: Omit<SkillGroupRowsProps, 'group'> & { group: Extract<SkillGroup, { kind: 'plugin' }> }) => {
    const { skill, subSkills } = group;
    const childrenId = useId();
    const [expanded, setExpanded] = useState(true);
    const expandable = subSkills.length > 0;
    const toggleExpanded = () => setExpanded((value) => !value);

    return (
        <SkillListRow
            icon={skill.icon ? <ProjectIcon iconId={skill.icon} size={16} /> : <LumoIcon name="Package" size={16} />}
            name={skill.name}
            description={getSkillSetMeta(skill)}
            enabled={skill.enabled}
            onOpen={() => onOpen(skill)}
            onEnabledChange={(enabled) => onEnabledChange(skill, enabled)}
            toggleTitle={c('collider_2025:Action').t`Turn on all ${skill.name} skills`}
            onEdit={() => onEdit(skill)}
            onDelete={() => onDelete(skill)}
            actions={
                expandable && (
                    <Button
                        icon
                        size="small"
                        shape="ghost"
                        className="shrink-0"
                        onClick={toggleExpanded}
                        aria-expanded={expanded}
                        aria-controls={childrenId}
                        aria-label={
                            expanded
                                ? c('collider_2025:Action').t`Collapse ${skill.name}`
                                : c('collider_2025:Action').t`Expand ${skill.name}`
                        }
                    >
                        <LumoIcon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
                    </Button>
                )
            }
        >
            {expandable && expanded && (
                <ul id={childrenId} className="skill-list-row__children">
                    {subSkills.map((subSkill) => (
                        <SkillListRow
                            key={subSkill.path}
                            name={subSkill.name}
                            description={subSkill.description}
                            enabled={subSkill.enabled}
                            locked={!skill.enabled}
                            onOpen={() => onOpenSubSkill(skill, subSkill)}
                            onEnabledChange={(enabled) => onSubSkillEnabledChange(skill, subSkill.path, enabled)}
                        />
                    ))}
                </ul>
            )}
        </SkillListRow>
    );
};

/** Rows of one group in the skills list: standalone skills, or a skill set with its skills nested under it. */
export const SkillGroupRows = ({ group, onOpen, ...handlers }: SkillGroupRowsProps) => {
    if (group.kind === 'plugin') {
        return <SkillSetRow group={group} onOpen={onOpen} {...handlers} />;
    }

    const badge = group.source === 'created' ? undefined : getSkillSourceLabel(group.source);
    return (
        <>
            {group.skills.map((skill) => (
                <SkillListRow
                    key={skill.id}
                    icon={<ProjectIcon iconId={skill.icon ?? DEFAULT_AGENT_ICON} size={16} />}
                    name={skill.name}
                    badge={badge}
                    description={skill.description}
                    enabled={skill.enabled}
                    onOpen={() => onOpen(skill)}
                    onEnabledChange={(enabled) => handlers.onEnabledChange(skill, enabled)}
                    onEdit={() => handlers.onEdit(skill)}
                    onDelete={() => handlers.onDelete(skill)}
                />
            ))}
        </>
    );
};
