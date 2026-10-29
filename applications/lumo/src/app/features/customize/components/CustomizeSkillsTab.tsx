import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoDispatch } from '../../../redux/hooks';
import { DeleteSkillPrompt } from '../../skills/components/DeleteSkillPrompt';
import { SkillEditorModal } from '../../skills/components/SkillEditorModal';
import {
    type ProtonPlugin,
    getProtonPlugins,
    protonPluginMatches,
    protonPluginToDraft,
} from '../../skills/protonCatalog';
import { deleteSkill, saveSkill, setSkillEnabled, setSubSkillEnabled } from '../../skills/skillsThunks';
import type { Skill } from '../../skills/types';
import { useSkills } from '../../skills/useSkills';
import type { SkillsView } from '../customizeTabs';
import { groupSkills } from '../skillGroups';
import { getSkillPath, getSubSkillPath } from '../skillRoutes';
import { SkillGroupSection } from './SkillGroupSection';
import { SkillsDiscover } from './SkillsDiscover';
import { SkillsMigrationNotice } from './SkillsMigrationNotice';

interface CustomizeSkillsTabProps {
    view: SkillsView;
    searchQuery: string;
    onBrowse: () => void;
}

export const CustomizeSkillsTab = ({ view, searchQuery, onBrowse }: CustomizeSkillsTabProps) => {
    const history = useHistory();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const { status, skills } = useSkills();
    const editorModal = useModalStateObject();
    const deletePrompt = useModalStateObject();
    const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>();
    const [addingId, setAddingId] = useState<string>();

    const addedSkillIds = useMemo(
        () =>
            new Map(
                skills.flatMap((skill): [string, string][] =>
                    skill.source === 'proton' && skill.legacyAgentId ? [[skill.legacyAgentId, skill.id]] : []
                )
            ),
        [skills]
    );

    const groups = useMemo(() => groupSkills(skills, searchQuery), [skills, searchQuery]);

    const protonPlugins = useMemo(
        () => getProtonPlugins().filter((plugin) => protonPluginMatches(plugin, searchQuery)),
        [searchQuery]
    );

    const migratedCount = skills.filter((skill) => skill.source === 'custom-lumo').length;

    const handleAdd = async (plugin: ProtonPlugin) => {
        setAddingId(plugin.id);
        try {
            await dispatch(saveSkill({ draft: protonPluginToDraft(plugin) })).unwrap();
            const title = plugin.getTitle();
            createNotification({ text: c('collider_2025:Info').t`Added ${title} to your skills` });
        } catch {
            createNotification({ type: 'error', text: c('collider_2025:Error').t`Could not add the skill` });
        } finally {
            setAddingId(undefined);
        }
    };

    const handleDelete = async () => {
        if (selectedSkill) {
            await dispatch(deleteSkill(selectedSkill.id));
        }
    };

    const renderStatus = () => {
        if (status === 'error') {
            return (
                <p className="m-0 text-sm color-danger">{c('collider_2025:Error').t`Could not load your skills.`}</p>
            );
        }
        return <p className="m-0 text-sm color-weak">{c('collider_2025:Info').t`Loading…`}</p>;
    };

    const renderYourSkills = () => {
        if (groups.length === 0) {
            if (searchQuery.trim()) {
                return (
                    <p className="m-0 text-sm color-weak">{c('collider_2025:Info').t`No skills match your search.`}</p>
                );
            }
            return (
                <div className="flex flex-column flex-nowrap items-center gap-3 py-8 text-center">
                    <p className="m-0 color-weak">
                        {c('collider_2025:Info')
                            .t`Add a skill to tailor how ${LUMO_SHORT_APP_NAME} helps you. Type / in any chat to use it.`}
                    </p>
                    <Button color="norm" shape="outline" onClick={onBrowse}>
                        {c('collider_2025:Action').t`Browse skills from ${BRAND_NAME}`}
                    </Button>
                </div>
            );
        }
        return (
            <div className="flex flex-column flex-nowrap gap-6">
                {groups.map((group) => (
                    <SkillGroupSection
                        key={group.key}
                        group={group}
                        onOpen={(skill) => history.push(getSkillPath(skill.id))}
                        onOpenSubSkill={(skill, subSkill) => history.push(getSubSkillPath(skill.id, subSkill))}
                        onEnabledChange={(skill, enabled) => dispatch(setSkillEnabled({ id: skill.id, enabled }))}
                        onSubSkillEnabledChange={(skill, path, enabled) =>
                            dispatch(setSubSkillEnabled({ id: skill.id, path, enabled }))
                        }
                        onEdit={(skill) => {
                            setSelectedSkill(skill);
                            editorModal.openModal(true);
                        }}
                        onDelete={(skill) => {
                            setSelectedSkill(skill);
                            deletePrompt.openModal(true);
                        }}
                    />
                ))}
            </div>
        );
    };

    const renderContent = () => {
        if (status !== 'ready') {
            return renderStatus();
        }
        if (view === 'discover') {
            return (
                <SkillsDiscover
                    plugins={protonPlugins}
                    addedSkillIds={addedSkillIds}
                    addingId={addingId}
                    onAdd={handleAdd}
                    onOpen={(skillId) => history.push(getSkillPath(skillId))}
                />
            );
        }
        return <section aria-label={c('collider_2025:Title').t`Your skills`}>{renderYourSkills()}</section>;
    };

    return (
        <div className="customize-skills-tab flex flex-column flex-nowrap gap-8 flex-1">
            {view === 'yours' && migratedCount > 0 && <SkillsMigrationNotice customLumoCount={migratedCount} />}

            {renderContent()}

            {editorModal.render && selectedSkill && (
                <SkillEditorModal {...editorModal.modalProps} skillId={selectedSkill.id} />
            )}
            {deletePrompt.render && selectedSkill && (
                <DeleteSkillPrompt
                    {...deletePrompt.modalProps}
                    skillName={selectedSkill.name}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
};
