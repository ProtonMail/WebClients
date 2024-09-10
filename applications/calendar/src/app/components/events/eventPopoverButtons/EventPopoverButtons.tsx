import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { AppLink, Icon, ReloadSpinner, Tooltip } from '@proton/components';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import type { CalendarEvent, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

interface BaseProps {
    showButton: boolean;
}

interface EditButtonProps extends BaseProps {
    onEdit: () => void;
    loading: boolean;
}
export const PopoverEditButton = ({ showButton, loading, onEdit }: EditButtonProps) => {
    if (!showButton) {
        return null;
    }

    return (
        <Tooltip title={c('Edit event button tooltip').t`Edit event`}>
            <ButtonLike
                data-testid="event-popover:edit"
                shape="ghost"
                onClick={onEdit}
                disabled={loading}
                icon
                size="small"
            >
                <Icon name="pen" alt={c('Edit event button tooltip').t`Edit event`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface DeleteButtonProps extends BaseProps {
    onDelete: () => void;
    loading: boolean;
}
export const PopoverDeleteButton = ({ showButton, loading, onDelete }: DeleteButtonProps) => {
    if (!showButton) {
        return null;
    }

    return (
        <Tooltip title={c('Delete event button tooltip').t`Delete event`}>
            <ButtonLike
                data-testid="event-popover:delete"
                shape="ghost"
                onClick={loading ? noop : onDelete}
                loading={loading}
                icon
                size="small"
            >
                <Icon name="trash" alt={c('Delete event button tooltip').t`Delete event`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface DuplicateButtonProps extends BaseProps {
    onDuplicate?: () => void;
    loading: boolean;
}
export const PopoverDuplicateButton = ({ showButton, loading, onDuplicate }: DuplicateButtonProps) => {
    if (!showButton) {
        return null;
    }

    return (
        <Tooltip title={c('Duplicate event button tooltip').t`Duplicate event`}>
            <ButtonLike
                data-testid="event-popover:duplicate"
                shape="ghost"
                onClick={onDuplicate}
                disabled={loading}
                icon
                size="small"
            >
                <Icon name="squares" alt={c('Duplicate event button tooltip').t`Duplicate event`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface ReloadButtonProps extends BaseProps {
    onRefresh: () => void;
    loading: boolean;
}
const PopoverRefreshButton = ({ showButton, loading, onRefresh }: ReloadButtonProps) => {
    if (!showButton) {
        return null;
    }

    return (
        <Tooltip title={c('Reload event button tooltip').t`Reload event`}>
            <ButtonLike
                data-testid="event-popover:refresh"
                shape="ghost"
                onClick={loading ? noop : onRefresh}
                icon
                size="small"
            >
                <ReloadSpinner refreshing={loading} alt={c('Reload event button tooltip').t`Reload event`} />
            </ButtonLike>
        </Tooltip>
    );
};

interface PopoverViewButtonProps extends BaseProps {
    isSearchView: boolean;
    start: Date;
    eventData?: CalendarEvent | CalendarEventSharedData;
    onViewClick: () => void;
}
export const PopoverViewButton = ({
    showButton,
    start,
    isSearchView,
    eventData,
    onViewClick,
}: PopoverViewButtonProps) => {
    if (!showButton) {
        return null;
    }

    const linkTo =
        eventData &&
        getLinkToCalendarEvent({
            calendarID: eventData.CalendarID,
            eventID: eventData.ID,
            recurrenceID: getUnixTime(toLocalDate(fromUTCDate(start))),
        });

    const viewText = isSearchView
        ? c('View event button tooltip').t`Navigate to event`
        : c('View event button tooltip').t`Open in a new tab`;

    return (
        <Tooltip title={viewText}>
            {isSearchView ? (
                <ButtonLike data-testid="event-popover:open" shape="ghost" onClick={onViewClick} icon size="small">
                    <Icon name="arrow-out-square" size={3.5} alt={viewText} />
                </ButtonLike>
            ) : (
                <AppLink
                    data-testid="event-popover:open-in-new-tab"
                    to={linkTo || '/'}
                    reloadDocument
                    className="mr-2 button button-small button-ghost-weak button-for-icon"
                >
                    <Icon name="arrow-out-square" size={3.5} alt={viewText} />
                </AppLink>
            )}
        </Tooltip>
    );
};

interface EventReloadErrorActionProps {
    showDeleteButton: boolean;
    showReloadButton: boolean;
    loadingDelete: boolean;
    loadingRefresh: boolean;
    onDelete: () => void;
    onRefresh: () => Promise<void>;
}
export const EventReloadErrorAction = ({
    showDeleteButton,
    showReloadButton,
    loadingDelete,
    loadingRefresh,
    onDelete,
    onRefresh,
}: EventReloadErrorActionProps) => {
    return (
        <>
            {showReloadButton && (
                <div className="flex flex-nowrap justify-end">
                    <PopoverRefreshButton
                        loading={loadingRefresh}
                        showButton={showReloadButton}
                        onRefresh={onRefresh}
                    />
                </div>
            )}
            {showDeleteButton && (
                <div className="flex flex-nowrap justify-end">
                    <PopoverDeleteButton showButton={showDeleteButton} loading={loadingDelete} onDelete={onDelete} />
                </div>
            )}
        </>
    );
};
