import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { SearchModal } from '../../../components/Modals/SearchModal/SearchModal';
import { useLumoFlags } from '../../../hooks/useLumoFlags';

import './SchedulesPageHeader.scss';

interface SchedulesPageHeaderProps {
    onNewTaskClick?: () => void;
}

export const SchedulesPageHeader = ({ onNewTaskClick }: SchedulesPageHeaderProps) => {
    const history = useHistory();
    const searchModal = useModalStateObject();
    const { createScheduleTool: ffCreateScheduleTool } = useLumoFlags();

    const handleCreateWithLumo = () => {
        // translator: Editable starter message asking the assistant to help create a scheduled task.
        const prompt = c('collider_2025:Prefill').t`Help me create a scheduled task. `;
        history.push({ pathname: '/', hash: `prefill=${encodeURIComponent(prompt)}` });
    };

    const newTaskContent = (
        <span className="flex flex-nowrap items-center gap-2">
            <LumoIcon aria-hidden name="Plus" size={16} />
            {
                // translator: Button for creating a new scheduled task (imperative).
                c('collider_2025:Button').t`New task`
            }
        </span>
    );

    return (
        <div className="schedules-page-header flex flex-nowrap items-start gap-3 w-full">
            <div className="flex flex-column flex-1 gap-1 min-w-0">
                <h2 className="text-semibold">{c('collider_2025:Title').t`Scheduled tasks`}</h2>
                <p className="schedules-page-header__subtitle m-0 text-md">
                    {
                        // translator: Introduction to scheduled tasks. ${LUMO_SHORT_APP_NAME} is the product name.
                        c('collider_2025:Info').t`Set up regular tasks, then leave the rest to ${LUMO_SHORT_APP_NAME}.`
                    }
                </p>
            </div>
            <div className="flex flex-nowrap shrink-0 items-center gap-3">
                {/* Search button */}
                <Button
                    aria-label={
                        // translator: Opens the search modal for scheduled tasks (imperative).
                        c('collider_2025:Button').t`Search`
                    }
                    className="shrink-0"
                    icon
                    onClick={() => searchModal.openModal(true)}
                    shape="ghost"
                >
                    <LumoIcon aria-hidden name="Search" size={20} />
                </Button>

                {/* Dropdown for creating a new task with the assistant or manually */}
                {ffCreateScheduleTool ? (
                    <SimpleDropdown
                        as={Button}
                        className="shrink-0"
                        color="norm"
                        content={newTaskContent}
                        dropdownClassName="chat-dropdown-menu"
                        hasCaret={false}
                        originalPlacement="bottom-end"
                    >
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="flex flex-nowrap items-center gap-2 w-full"
                                onClick={handleCreateWithLumo}
                            >
                                <LumoIcon aria-hidden name="MessageSquare" size={16} />
                                <span>
                                    {
                                        // translator: Opens a new chat to create a scheduled task with the assistant.
                                        c('collider_2025:Action').t`Create with ${LUMO_SHORT_APP_NAME}`
                                    }
                                </span>
                            </DropdownMenuButton>
                            <DropdownMenuButton
                                className="flex flex-nowrap items-center gap-2 w-full"
                                onClick={onNewTaskClick}
                            >
                                <LumoIcon aria-hidden name="Settings" size={16} />
                                <span>
                                    {
                                        // translator: Opens the editor to configure a scheduled task manually (imperative).
                                        c('collider_2025:Action').t`Set up manually`
                                    }
                                </span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </SimpleDropdown>
                ) : (
                    <Button className="shrink-0" color="norm" onClick={onNewTaskClick}>
                        {newTaskContent}
                    </Button>
                )}
            </div>
            {searchModal.render && <SearchModal {...searchModal.modalProps} scope="schedule-runs" />}
        </div>
    );
};
