import { useId, useMemo, useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoDispatch } from '../../../redux/hooks';
import { getSkillCommands, groupSkillCommands } from '../../skills/skillInvocation';
import { getSkillSelectionId, resolveSkillSelection } from '../../skills/skillSelection';
import { loadSkills } from '../../skills/skillsThunks';
import { useSkills } from '../../skills/useSkills';
import { SkillChip } from './SkillChip';
import { SkillListReadyView } from './SkillListReadyView';

interface SkillListProps {
    /** Selected skill IDs or bundle-ID/sub-skill-path references; metadata comes from the skills store. */
    value: string[];
    /** Enables editing and receives the updated references when a skill is added or removed. */
    onChange?: (ids: string[]) => void;
    /** Additional classes for the Skills heading. */
    headerClassName?: string;
    /** Displays side-panel rows with status and action menus instead of chips and the picker. */
    rows?: boolean;
}

const SkillListLoadingView = () => (
    <div className="text-sm color-weak">
        {
            // translator: Loading status while retrieving skills for a scheduled task.
            c('collider_2025:Info').t`Loading skills`
        }
        <EllipsisLoader />
    </div>
);

const SkillListErrorView = () => {
    const dispatch = useLumoDispatch();
    return (
        <div role="alert" className="text-sm color-danger">
            {
                // translator: Error shown when the scheduled task's skills could not be retrieved.
                c('collider_2025:Error').t`Could not load skills`
            }{' '}
            <Button
                size="small"
                shape="underline"
                onClick={() => {
                    void dispatch(loadSkills());
                }}
            >
                {
                    // translator: Retry loading the skills list after a retrieval error (imperative).
                    c('collider_2025:Action').t`Retry`
                }
            </Button>
        </div>
    );
};

export const SkillList = ({ value, onChange, headerClassName, rows }: SkillListProps) => {
    const { customAgents: skillsEnabled } = useLumoFlags();
    const { skills, status } = useSkills({ enabled: skillsEnabled });

    const labelId = useId();
    const addRef = useRef<HTMLButtonElement>(null);

    const availableCommands = useMemo(() => {
        const bundleIds = new Set(skills.filter(({ subSkills }) => subSkills?.length).map(({ id }) => id));
        // Offer individual sub-skills instead of their bundle's root command.
        // The shared resolver uses name order for handle conflicts, matching this display list.
        const selectableCommands = getSkillCommands(skills).filter(
            ({ skillId, subSkillPath }) => subSkillPath || !bundleIds.has(skillId)
        );
        return groupSkillCommands(selectableCommands);
    }, [skills]);
    const availableSelectionIds = new Set(availableCommands.map(getSkillSelectionId));

    const loading = skillsEnabled && (status === 'idle' || status === 'loading');
    const error = skillsEnabled && status === 'error';
    // Saved references remain visible and removable even when they cannot currently be used.
    const isUnavailable = (id: string) => !skillsEnabled || status !== 'ready' || !availableSelectionIds.has(id);
    // Wait for loading to finish before warning about unavailable selections.
    const hasUnavailable = !loading && value.some(isUnavailable);

    if (!skillsEnabled && !value.length) return null;

    // These labels are shared by chips and rows, including while saved selections are loading.
    // translator: Status in a selected skill's tooltip while the skills store is loading.
    const loadingLabel = c('collider_2025:Info').t`Loading skills`;
    // translator: Status for a selected skill that is disabled, missing, unreadable or not enabled for this task.
    const unavailableLabel = c('collider_2025:Info').t`Skill unavailable`;

    return (
        <section className="flex flex-column flex-nowrap gap-3" aria-labelledby={labelId}>
            <span hidden={rows} id={labelId} className={clsx('text-semibold', headerClassName)}>
                {
                    // translator: Heading or accessible list name for skills and sub-skills in the scheduled task editor or side panel.
                    c('collider_2025:Label').t`Skills`
                }
            </span>
            <div className={rows ? 'flex flex-column flex-nowrap' : 'flex flex-wrap gap-2'}>
                {/* Keep saved references visible and removable in every loading state. */}
                {value.map((id) => (
                    <SkillChip
                        key={id}
                        skill={resolveSkillSelection(id, skills)}
                        rows={rows}
                        unavailable={!loading && isUnavailable(id)}
                        statusLabel={loading ? loadingLabel : isUnavailable(id) ? unavailableLabel : undefined}
                        onRemove={
                            onChange
                                ? () => {
                                      onChange(value.filter((selected) => selected !== id));
                                      addRef.current?.focus();
                                  }
                                : undefined
                        }
                    />
                ))}
                {status === 'ready' && skillsEnabled && onChange && !rows && (
                    <SkillListReadyView
                        commands={availableCommands}
                        value={value}
                        onChange={onChange}
                        buttonRef={addRef}
                    />
                )}
            </div>
            {loading && <SkillListLoadingView />}
            {error && <SkillListErrorView />}
            {hasUnavailable && (
                <Banner variant="warning" className="text-sm">
                    {
                        // translator: Warning that selected skills cannot be used by the scheduled task; removing one from the task does not delete the skill.
                        c('collider_2025:Info')
                            .t`Some selected skills are unavailable. This task may run without them. Check your skills in settings.`
                    }
                </Banner>
            )}
            {onChange && !rows && (
                <p className="m-0 text-sm color-hint">
                    {
                        // translator: Helper text below the task's skill picker. ${LUMO_SHORT_APP_NAME} is the product name; selected skills apply automatically, while other enabled skills remain available on demand.
                        c('collider_2025:Info').t`${LUMO_SHORT_APP_NAME} uses the skills you add here automatically.`
                    }
                </p>
            )}
        </section>
    );
};
