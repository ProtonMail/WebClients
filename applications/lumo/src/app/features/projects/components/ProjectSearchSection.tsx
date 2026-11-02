import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ChatSearchSelect, FileSearchSelect } from '../../../components/ChatSearchSelect/ChatSearchSelect';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoUserSettings } from '../../../hooks';
import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { ChatSearchReach, ProjectSpace, SpaceKeyClear } from '../../../types';
import { resolveSearchReach } from '../../client-tools/retrievalTool/searchReach';

type ProjectSearchSettings = Pick<ProjectSpace, 'chatSearch' | 'searchOtherProjects' | 'isPrivate'>;

interface ProjectSearchSectionProps {
    space: ProjectSpace & SpaceKeyClear;
}

interface SearchRowProps {
    id: string;
    label: string;
    /** What the current choice means. */
    hint: string;
    /** Set when the row can follow the user's general settings. */
    isOverridden?: boolean;
    onReset?: () => void;
    control: ReactNode;
}

const SearchRow = ({ id, label, hint, isOverridden, onReset, control }: SearchRowProps) => (
    <div className="flex flex-nowrap items-center justify-space-between gap-3 text-sm">
        <div className="flex flex-column flex-nowrap gap-0.5 min-w-0">
            <div className="flex flex-nowrap items-baseline gap-2">
                <label htmlFor={id} className="text-ellipsis">
                    {label}
                </label>
                {isOverridden && (
                    <Button
                        shape="underline"
                        color="weak"
                        size="small"
                        className="p-0 shrink-0"
                        onClick={onReset}
                        title={c('collider_2025:Info').t`Use your general setting`}
                    >
                        {c('collider_2025:Action').t`Reset`}
                    </Button>
                )}
            </div>
            <span className="color-weak text-xs">{hint}</span>
        </div>
        <div className="shrink-0 w-custom flex justify-end" style={{ '--w-custom': '9rem' }}>
            {control}
        </div>
    </div>
);

const chatSearchHint = (chatSearch: ChatSearchReach) => {
    switch (chatSearch) {
        case 'none':
            return c('collider_2025:Info').t`Only the chat you're in.`;
        case 'project':
            return c('collider_2025:Info').t`Other chats in this project.`;
        case 'all':
            return c('collider_2025:Info').t`All your chats, except ghost chats and projects that aren't searchable.`;
    }
};

/** How far knowledge lookup reaches from this project's chats. Unset values follow the user's settings. */
export const ProjectSearchSection = ({ space }: ProjectSearchSectionProps) => {
    const dispatch = useLumoDispatch();
    const { lumoUserSettings } = useLumoUserSettings();
    const { chatSearch, searchOtherSpaces } = resolveSearchReach(lumoUserSettings, space);

    const update = (change: ProjectSearchSettings) => {
        dispatch(addSpace({ ...space, ...change }));
        dispatch(pushSpaceRequest({ id: space.id }));
    };

    const chatsId = `project-search-chats-${space.id}`;
    const projectsId = `project-search-projects-${space.id}`;
    const privateId = `project-search-private-${space.id}`;

    return (
        <div className="project-files-section flex-none">
            <div className="project-files-section-header">
                <h3 className="project-files-section-title flex flex-nowrap items-center gap-1">
                    {c('collider_2025:Title').t`Search`}
                    <Tooltip
                        title={c('collider_2025:Info')
                            .t`What ${LUMO_SHORT_APP_NAME} can look up from this project's chats. Follows your general settings unless changed here.`}
                    >
                        <Button icon shape="ghost" size="small" aria-label={c('collider_2025:Title').t`About search`}>
                            <LumoIcon name="Info" size={16} />
                        </Button>
                    </Tooltip>
                </h3>
            </div>
            <div className="flex flex-column gap-4">
                <SearchRow
                    id={chatsId}
                    label={c('collider_2025:Label').t`Past chats`}
                    hint={chatSearchHint(chatSearch)}
                    isOverridden={space.chatSearch !== undefined}
                    onReset={() => update({ chatSearch: undefined })}
                    control={
                        <ChatSearchSelect
                            id={chatsId}
                            context="project"
                            value={chatSearch}
                            onChange={(value) => update({ chatSearch: value })}
                        />
                    }
                />
                <SearchRow
                    id={projectsId}
                    label={c('collider_2025:Label').t`Files`}
                    hint={
                        searchOtherSpaces
                            ? c('collider_2025:Info').t`Files from all your projects.`
                            : c('collider_2025:Info').t`Only this project's files.`
                    }
                    isOverridden={space.searchOtherProjects !== undefined}
                    onReset={() => update({ searchOtherProjects: undefined })}
                    control={
                        <FileSearchSelect
                            id={projectsId}
                            context="project"
                            value={searchOtherSpaces}
                            onChange={(value) => update({ searchOtherProjects: value })}
                        />
                    }
                />
                <SearchRow
                    id={privateId}
                    label={c('collider_2025:Label').t`Project content is searchable`}
                    hint={
                        space.isPrivate
                            ? c('collider_2025:Info').t`Only chats in this project can look up its chats and files.`
                            : c('collider_2025:Info').t`Chats outside this project can look up its chats and files.`
                    }
                    control={
                        <Toggle
                            id={privateId}
                            checked={space.isPrivate !== true}
                            onChange={() => update({ isPrivate: space.isPrivate ? undefined : true })}
                        />
                    }
                />
            </div>
        </div>
    );
};
