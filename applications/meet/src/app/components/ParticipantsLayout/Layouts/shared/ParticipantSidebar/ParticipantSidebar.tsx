import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { PARTICIPANTS_SIDE_BAR_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectParticipantSideBarOpen,
    selectShowsScreenShareInSidebar,
    toggleParticipantSideBar,
} from '@proton/meet/store/slices/layoutSlice';
import {
    selectPage,
    selectSidebarPageCount,
    setPage as setPageAction,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import clsx from '@proton/utils/clsx';

import { Pagination } from '../../../../../atoms/Pagination/Pagination';
import { useSidebarPagedParticipants } from '../../../../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';
import { ScreenShareTile } from '../ScreenShareTile';

import './ParticipantSidebar.scss';

export const ParticipantSidebar = () => {
    const dispatch = useMeetDispatch();
    const page = useMeetSelector(selectPage);
    const setPage = (page: number) => dispatch(setPageAction(page));

    const participantSideBarOpen = useMeetSelector(selectParticipantSideBarOpen);

    const sidebarParticipants = useSidebarPagedParticipants();

    const pageCount = useMeetSelector(selectSidebarPageCount);

    const showsScreenShareInSidebar = useMeetSelector(selectShowsScreenShareInSidebar);

    const ButtonIcon = participantSideBarOpen ? IcChevronRight : IcMeetParticipants;

    return (
        <div className="participant-sidebar relative" style={{ '--items-per-page': PARTICIPANTS_SIDE_BAR_PAGE_SIZE }}>
            <Button
                className="participant-sidebar__toggle absolute bg-weak border-none"
                onClick={() => dispatch(toggleParticipantSideBar())}
                title={participantSideBarOpen ? c('Action').t`Hide participants` : c('Action').t`Show participants`}
            >
                <ButtonIcon size={6} />
            </Button>
            <div className={clsx('participant-sidebar__list hide-scrollbar', !participantSideBarOpen && 'inactive')}>
                {pageCount > 1 && (
                    <div
                        className={clsx(
                            'participant-sidebar__pagination-container absolute flex justify-center items-center w-full z-up',
                            !participantSideBarOpen && 'inactive'
                        )}
                    >
                        <Pagination totalPages={pageCount} currentPage={page} onPageChange={setPage} />
                    </div>
                )}
                {participantSideBarOpen && (
                    <>
                        {showsScreenShareInSidebar && (
                            <div className="participant-sidebar__list__item">
                                <ScreenShareTile />
                            </div>
                        )}
                        {sidebarParticipants.map((participant) => (
                            <div key={participant.identity} className="participant-sidebar__list__item">
                                <ParticipantTile participant={participant} viewSize="xsmall" />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
