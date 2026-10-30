import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ChatSearchSelect } from '../../../components/ChatSearchSelect/ChatSearchSelect';
import { useLumoUserSettings } from '../../../hooks';
import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { ProjectSpace, SpaceKeyClear } from '../../../types';
import { resolveSearchReach } from '../../client-tools/retrievalTool/searchReach';

type ProjectSearchSettings = Pick<ProjectSpace, 'chatSearch' | 'searchOtherProjects'>;

interface ProjectSearchSectionProps {
    space: ProjectSpace & SpaceKeyClear;
}

interface SearchRowProps {
    id: string;
    label: string;
    isOverridden: boolean;
    onReset: () => void;
    control: ReactNode;
}

const SearchRow = ({ id, label, isOverridden, onReset, control }: SearchRowProps) => (
    <div className="flex flex-nowrap items-center justify-space-between gap-3">
        <div className="flex flex-column text-sm">
            <label htmlFor={id}>{label}</label>
            {isOverridden ? (
                <span className="color-weak">
                    {
                        // translator: Short status: this project's setting differs from the user's general settings; followed by a "Reset" link.
                        c('collider_2025:Info').t`Custom`
                    }
                    {' · '}
                    <Button shape="underline" color="norm" size="small" className="p-0" onClick={onReset}>
                        {c('collider_2025:Action').t`Reset`}
                    </Button>
                </span>
            ) : (
                <span className="color-weak">
                    {
                        // translator: The setting follows the user's general settings.
                        c('collider_2025:Info').t`Default`
                    }
                </span>
            )}
        </div>
        <div className="shrink-0">{control}</div>
    </div>
);

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

    return (
        <div className="project-files-section flex-none">
            <div className="project-files-section-header flex-column items-start">
                <h3 className="project-files-section-title">{c('collider_2025:Title').t`Search`}</h3>
                <p className="m-0 text-sm color-weak">
                    {c('collider_2025:Info').t`What ${LUMO_SHORT_APP_NAME} can use from your content.`}
                </p>
            </div>
            <div className="flex flex-column gap-3">
                <SearchRow
                    id={chatsId}
                    label={c('collider_2025:Label').t`Other chats`}
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
                    label={c('collider_2025:Label').t`Files in other projects`}
                    isOverridden={space.searchOtherProjects !== undefined}
                    onReset={() => update({ searchOtherProjects: undefined })}
                    control={
                        <Toggle
                            id={projectsId}
                            checked={searchOtherSpaces}
                            onChange={() => update({ searchOtherProjects: !searchOtherSpaces })}
                        />
                    }
                />
            </div>
        </div>
    );
};
