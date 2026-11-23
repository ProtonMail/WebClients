import { Fragment } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

const MENU_SIZE: DropdownSize = { width: '18rem', maxHeight: '24rem' };

interface SkillAddMenuProps {
    /** `header` sits in the panel header; `footer` is the bottom of the file tree. */
    variant: 'header' | 'footer';
    /** Where a new file or folder goes; `''` is the top level. */
    targetFolder: string;
    onAddFile: () => void;
    onAddFolder: () => void;
    onAddSkill: () => void;
    onAddConnectors: () => void;
}

type AddAction = {
    key: string;
    icon: IconName;
    label: string;
    hint?: string;
    onSelect: () => void;
    titleBefore?: string;
};

/**
 * Below the file tree: New file and New folder as icon buttons, going where the tree's selection is, then
 * an "Add from template" menu. In the header, while SKILL.md is the only file, one "+" menu holds them all.
 */
export const SkillAddMenu = ({
    variant,
    targetFolder,
    onAddFile,
    onAddFolder,
    onAddSkill,
    onAddConnectors,
}: SkillAddMenuProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    // translator: Button that creates an empty file in a folder of a skill. ${targetFolder} is a folder path, such as "skills/report".
    const newFileInFolder = c('collider_2025:Action').t`New file in ${targetFolder}/`;
    // translator: Button that creates an empty file at the top of a skill's files, outside any folder.
    const newFileAtTop = c('collider_2025:Action').t`New file`;
    // translator: Button that creates an empty folder in a folder of a skill. ${targetFolder} is a folder path, such as "skills/report".
    const newFolderInFolder = c('collider_2025:Action').t`New folder in ${targetFolder}/`;
    // translator: Button that creates an empty folder at the top of a skill's files, outside any folder.
    const newFolderAtTop = c('collider_2025:Action').t`New folder`;
    // translator: Menu button that lists ready-made files to add to a skill, such as another skill or a connectors file (imperative).
    const addLabel = c('collider_2025:Action').t`Add from template`;
    // translator: Accessible name of the "+" menu button that adds a file, a folder or a file from a template to a skill (imperative).
    const addMenuLabel = c('collider_2025:Action').t`Add`;
    // translator: Hint under "Add connector config": connectors only take effect in the desktop app. ${LUMO_SHORT_APP_NAME} is the product name, as in "Lumo Desktop".
    const connectorsHint = c('collider_2025:Info').t`Works in ${LUMO_SHORT_APP_NAME} Desktop only`;

    const iconButtons: { key: string; icon: IconName; label: string; onClick: () => void }[] = [
        {
            key: 'file',
            icon: 'FilePlusCorner',
            label: targetFolder ? newFileInFolder : newFileAtTop,
            onClick: onAddFile,
        },
        {
            key: 'folder',
            icon: 'FolderPlus',
            label: targetFolder ? newFolderInFolder : newFolderAtTop,
            onClick: onAddFolder,
        },
    ];

    const templateActions: AddAction[] = [
        {
            key: 'skill',
            icon: 'ScrollText',
            // translator: Menu item that adds another skill, with its own instructions file, turning this skill into a skill set (a bundle of skills).
            label: c('collider_2025:Action').t`Add skill to skill set`,
            onSelect: onAddSkill,
        },
        {
            key: 'connectors',
            icon: 'Plug',
            // translator: Menu item that adds a configuration file listing the kinds of tools (connectors) the skills can use.
            label: c('collider_2025:Action').t`Add connector config`,
            hint: connectorsHint,
            onSelect: onAddConnectors,
        },
    ];
    const isHeader = variant === 'header';
    const actions: AddAction[] = isHeader
        ? [
              ...iconButtons.map(({ key, icon, label, onClick }) => ({ key, icon, label, onSelect: onClick })),
              { ...templateActions[0], titleBefore: c('collider_2025:Label').t`Templates` },
              ...templateActions.slice(1),
          ]
        : templateActions;

    return (
        <div className={clsx('flex flex-nowrap items-center gap-1', !isHeader && 'p-2 border-top border-weak')}>
            {isHeader ? (
                <Button
                    ref={anchorRef}
                    icon
                    size="small"
                    shape="ghost"
                    title={addMenuLabel}
                    aria-label={addMenuLabel}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={toggle}
                >
                    <LumoIcon aria-hidden name="Plus" size={16} />
                </Button>
            ) : (
                <>
                    {iconButtons.map(({ key, icon, label, onClick }) => (
                        <Button
                            key={key}
                            icon
                            size="small"
                            shape="ghost"
                            title={label}
                            aria-label={label}
                            onClick={onClick}
                        >
                            <LumoIcon aria-hidden name={icon} size={16} />
                        </Button>
                    ))}
                    <Button
                        ref={anchorRef}
                        size="tiny"
                        shape="ghost"
                        className="ml-auto border border-weak"
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                        onClick={toggle}
                    >
                        <span className="flex flex-nowrap items-center gap-1">
                            {addLabel}
                            <LumoIcon aria-hidden name="ChevronDown" size={14} />
                        </span>
                    </Button>
                </>
            )}

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                size={MENU_SIZE}
                originalPlacement={isHeader ? 'bottom-end' : 'top-start'}
            >
                <DropdownMenu>
                    {actions.map((action) => (
                        <Fragment key={action.key}>
                            {action.titleBefore && (
                                <>
                                    <hr className="lumo-color-glyph-mid mx-3 my-1" />
                                    <span className="block px-3 pt-2 pb-1 lumo-label-medium lumo-color-glyph-mid">
                                        {action.titleBefore}
                                    </span>
                                </>
                            )}
                            <DropdownMenuButton
                                className="flex flex-nowrap items-start gap-3 text-left"
                                onClick={() => {
                                    close();
                                    action.onSelect();
                                }}
                            >
                                <LumoIcon aria-hidden name={action.icon} size={16} className="shrink-0 mt-0.5" />
                                <span className="flex flex-column flex-nowrap min-w-0">
                                    <span>{action.label}</span>
                                    {action.hint && (
                                        <span className="lumo-body-small lumo-color-glyph-mid">{action.hint}</span>
                                    )}
                                </span>
                            </DropdownMenuButton>
                        </Fragment>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};
