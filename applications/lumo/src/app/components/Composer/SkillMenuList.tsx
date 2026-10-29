import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { getSkillCommands, groupSkillCommands } from '../../features/skills/skillInvocation';
import { useSkills } from '../../features/skills/useSkills';
import { useLumoDispatch } from '../../redux/hooks';
import { insertSkillCommand } from '../../redux/slices/composerActions';
import { LumoIcon } from '../LumoIcon/LumoIcon';

interface SkillMenuListProps {
    onBack: () => void;
    onClose: () => void;
}

/** Tools menu sub-view: picks a skill to invoke, like typing `/handle` in the composer. */
export const SkillMenuList = ({ onBack, onClose }: SkillMenuListProps) => {
    const history = useHistory();
    const dispatch = useLumoDispatch();
    const { status, skills } = useSkills();
    const commands = useMemo(() => groupSkillCommands(getSkillCommands(skills)), [skills]);

    const goTo = (path: string) => {
        onClose();
        history.push(path);
    };

    return (
        <div className="flex flex-column">
            <DropdownMenuButton className="justify-start" onClick={onBack}>
                <div className="flex items-center gap-2 w-full">
                    <LumoIcon name="ChevronLeft" size={16} />
                    <span className="text-sm font-medium">{c('collider_2025: Action').t`Skills`}</span>
                </div>
            </DropdownMenuButton>

            <div className="overflow-auto max-h-custom" style={{ '--max-h-custom': '16rem' }}>
                {status === 'ready' && commands.length === 0 && (
                    <div className="px-4 py-2 text-xs color-hint">{c('collider_2025: Info').t`No skills turned on`}</div>
                )}
                {commands.map((command, index) => {
                    const startsGroup = command.group && command.group !== commands[index - 1]?.group;
                    return (
                        <div key={command.handle}>
                            {startsGroup && (
                                <div className="px-4 pt-2 pb-1 text-xs color-hint text-ellipsis">{command.group}</div>
                            )}
                            <DropdownMenuButton
                                className="justify-start"
                                title={command.description}
                                onClick={() => {
                                    dispatch(insertSkillCommand(command.handle));
                                    onClose();
                                }}
                            >
                                <span className="text-sm text-ellipsis block text-left">/{command.handle}</span>
                            </DropdownMenuButton>
                        </div>
                    );
                })}
            </div>

            <hr className="my-1 w-custom mx-auto" style={{ '--w-custom': '90%' }} />
            <DropdownMenuButton className="justify-start" onClick={() => goTo('/customize')}>
                <div className="flex items-center gap-3 w-full">
                    <LumoIcon name="Settings" size={16} />
                    <span className="text-sm">{c('collider_2025: Action').t`Manage skills`}</span>
                </div>
            </DropdownMenuButton>
            <DropdownMenuButton className="justify-start" onClick={() => goTo('/customize/upload')}>
                <div className="flex items-center gap-3 w-full">
                    <LumoIcon name="Upload" size={16} />
                    <span className="text-sm">{c('collider_2025: Action').t`Upload a skill`}</span>
                </div>
            </DropdownMenuButton>
        </div>
    );
};
