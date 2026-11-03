import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoUserSettings } from '../../../hooks';
import type { ChatSearchReach, ProjectSpace, SpaceKeyClear } from '../../../types';
import { resolveSearchReach } from '../../client-tools/retrievalTool/searchReach';
import { ProjectSearchModal } from '../modals/ProjectSearchModal';

interface ProjectSearchSectionProps {
    space: ProjectSpace & SpaceKeyClear;
}

const chatSearchSummary = (chatSearch: ChatSearchReach) => {
    switch (chatSearch) {
        case 'none':
            // translator: Short summary of a project's search setting: past chats are not searched.
            return c('collider_2025:Info').t`No past chats`;
        case 'project':
            // translator: Short summary of a project's search setting: only this project's chats are searched.
            return c('collider_2025:Info').t`This project's chats`;
        case 'all':
            // translator: Short summary of a project's search setting: every searchable chat is searched.
            return c('collider_2025:Info').t`All chats`;
    }
};

/** How far knowledge lookup reaches from this project's chats, edited in a modal. */
export const ProjectSearchSection = ({ space }: ProjectSearchSectionProps) => {
    const { lumoUserSettings } = useLumoUserSettings();
    const { chatSearch, searchOtherSpaces } = resolveSearchReach(lumoUserSettings, space);
    const searchModal = useModalStateObject();

    const summary = [
        chatSearchSummary(chatSearch),
        searchOtherSpaces
            ? // translator: Short summary of a project's search setting: files of every project can be searched.
              c('collider_2025:Info').t`Files of all projects`
            : // translator: Short summary of a project's search setting: only this project's files can be searched.
              c('collider_2025:Info').t`This project's files`,
        space.isPrivate &&
            // translator: Short summary of a project's search setting: chats elsewhere can't search this project.
            c('collider_2025:Info').t`Hidden from other chats`,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <div className="project-files-section flex-none">
            <div className="project-files-section-header">
                <h3 className="project-files-section-title flex flex-nowrap items-center gap-1">
                    {c('collider_2025:Title').t`What can ${LUMO_SHORT_APP_NAME} see?`}
                    <Tooltip
                        title={c('collider_2025:Info')
                            .t`What ${LUMO_SHORT_APP_NAME} can look up from this project's chats. Follows your general settings unless changed here.`}
                    >
                        <Button icon shape="ghost" size="small" aria-label={c('collider_2025:Title').t`About search`}>
                            <LumoIcon name="Info" size={16} />
                        </Button>
                    </Tooltip>
                </h3>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={() => searchModal.openModal(true)}
                    title={c('collider_2025:Action').t`Edit search settings`}
                >
                    <LumoIcon name="Pen" size={16} />
                </Button>
            </div>
            <p className="m-0 text-sm color-weak">{summary}</p>
            {searchModal.render && <ProjectSearchModal space={space} {...searchModal.modalProps} />}
        </div>
    );
};
