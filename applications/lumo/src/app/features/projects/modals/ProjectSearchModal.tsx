import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ChatSearchSelect, FileSearchSelect } from '../../../components/ChatSearchSelect/ChatSearchSelect';
import { useLumoUserSettings } from '../../../hooks';
import { useLumoDispatch } from '../../../redux/hooks';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { ChatSearchReach, ProjectSpace, SpaceKeyClear } from '../../../types';
import { resolveSearchReach } from '../../client-tools/retrievalTool/searchReach';

type ProjectSearchSettings = Pick<ProjectSpace, 'chatSearch' | 'searchOtherProjects' | 'isPrivate'>;

interface ProjectSearchModalProps extends ModalStateProps {
    space: ProjectSpace & SpaceKeyClear;
}

interface SettingProps {
    id: string;
    label: string;
    /** What the setting does, whatever its value. */
    description: string;
    /** What the current choice means. */
    hint: string;
    /** Whether the choice can follow the user's general settings, and does. */
    followsGeneral?: boolean;
    onUseGeneral?: () => void;
    control: ReactNode;
}

const Setting = ({ id, label, description, hint, followsGeneral, onUseGeneral, control }: SettingProps) => (
    <div className="flex flex-nowrap items-start justify-space-between gap-6">
        <div className="flex flex-column flex-nowrap gap-1 min-w-0">
            <label htmlFor={id} className="text-semibold">
                {label}
            </label>
            <p className="m-0 text-sm color-weak">{description}</p>
            <p className="m-0 text-sm">{hint}</p>
            {followsGeneral !== undefined && (
                <p className="m-0 text-sm color-weak flex flex-wrap items-baseline gap-x-2">
                    {followsGeneral ? (
                        c('collider_2025:Info').t`Follows your general setting.`
                    ) : (
                        <>
                            {c('collider_2025:Info').t`Set for this project.`}
                            <Button shape="underline" color="weak" size="small" className="p-0" onClick={onUseGeneral}>
                                {c('collider_2025:Action').t`Use general setting`}
                            </Button>
                        </>
                    )}
                </p>
            )}
        </div>
        <div className="shrink-0 w-custom flex justify-end" style={{ '--w-custom': '10rem' }}>
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

/** Edits how far knowledge lookup reaches from this project's chats. Unset values follow the user's settings. */
export const ProjectSearchModal = ({ space, ...modalProps }: ProjectSearchModalProps) => {
    const dispatch = useLumoDispatch();
    const { lumoUserSettings } = useLumoUserSettings();
    const [draft, setDraft] = useState<ProjectSearchSettings>({
        chatSearch: space.chatSearch,
        searchOtherProjects: space.searchOtherProjects,
        isPrivate: space.isPrivate,
    });
    const { chatSearch, searchOtherSpaces } = resolveSearchReach(lumoUserSettings, { ...space, ...draft });
    const change = (next: ProjectSearchSettings) => setDraft((previous) => ({ ...previous, ...next }));

    const handleSave = () => {
        dispatch(addSpace({ ...space, ...draft }));
        dispatch(pushSpaceRequest({ id: space.id }));
        modalProps.onClose?.();
    };

    const chatsId = `project-search-chats-${space.id}`;
    const filesId = `project-search-files-${space.id}`;
    const visibleId = `project-search-visible-${space.id}`;

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={c('collider_2025:Title').t`What can ${LUMO_SHORT_APP_NAME} see?`} />
            <ModalTwoContent>
                <p className="mt-0 mb-6 color-weak">
                    {c('collider_2025:Info')
                        .t`When answering in this project, ${LUMO_SHORT_APP_NAME} can look things up in your past chats and files. These settings decide how far it looks. What you don't change here follows your general settings.`}
                </p>
                <div className="flex flex-column gap-6">
                    <Setting
                        id={chatsId}
                        label={c('collider_2025:Label').t`Past chats`}
                        description={c('collider_2025:Info')
                            .t`Lets ${LUMO_SHORT_APP_NAME} find what you discussed before, such as a decision or a figure from an earlier chat.`}
                        hint={chatSearchHint(chatSearch)}
                        followsGeneral={draft.chatSearch === undefined}
                        onUseGeneral={() => change({ chatSearch: undefined })}
                        control={
                            <ChatSearchSelect
                                id={chatsId}
                                context="project"
                                value={chatSearch}
                                onChange={(value) => change({ chatSearch: value })}
                            />
                        }
                    />
                    <Setting
                        id={filesId}
                        label={c('collider_2025:Label').t`Files`}
                        description={c('collider_2025:Info')
                            .t`${LUMO_SHORT_APP_NAME} looks through this project's files. It can also look through the files of your other projects that are searchable.`}
                        hint={
                            searchOtherSpaces
                                ? c('collider_2025:Info').t`Files from all your projects.`
                                : c('collider_2025:Info').t`Only this project's files.`
                        }
                        followsGeneral={draft.searchOtherProjects === undefined}
                        onUseGeneral={() => change({ searchOtherProjects: undefined })}
                        control={
                            <FileSearchSelect
                                id={filesId}
                                context="project"
                                value={searchOtherSpaces}
                                onChange={(value) => change({ searchOtherProjects: value })}
                            />
                        }
                    />
                    <Setting
                        id={visibleId}
                        label={c('collider_2025:Label').t`Searchable from other chats`}
                        description={c('collider_2025:Info')
                            .t`Chats outside this project can find its chats and files when their own settings reach this far. Turn it off for sensitive work.`}
                        hint={
                            draft.isPrivate
                                ? c('collider_2025:Info').t`Only chats in this project can look up its chats and files.`
                                : c('collider_2025:Info').t`Chats outside this project can look up its chats and files.`
                        }
                        control={
                            <Toggle
                                id={visibleId}
                                checked={draft.isPrivate !== true}
                                onChange={() => change({ isPrivate: draft.isPrivate ? undefined : true })}
                            />
                        }
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} color="weak">
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button onClick={handleSave} color="norm">
                    {c('collider_2025:Button').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
