import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcMeetParticipants } from '@proton/icons/icons/IcMeetParticipants';
import { SCREEN_SHARE_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectPage, setPage as setPageAction } from '@proton/meet/store/slices/meetingState';
import { selectMeetSettings } from '@proton/meet/store/slices/settings';
import clsx from '@proton/utils/clsx';

import { Pagination } from '../../atoms/Pagination/Pagination';
import { useSortedParticipantsContext } from '../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { ParticipantTile } from '../ParticipantTile/ParticipantTile';

import './ParticipantSidebar.scss';

export const ParticipantSidebar = ({
    participantSideBarOpen,
    setParticipantSideBarOpen,
}: {
    participantSideBarOpen: boolean;
    setParticipantSideBarOpen: (open: boolean) => void;
}) => {
    const { pagedParticipants, pagedParticipantsWithoutSelfView, pageCount, pageCountWithoutSelfView } =
        useSortedParticipantsContext();
    const page = useMeetSelector(selectPage);
    const dispatch = useMeetDispatch();
    const setPage = (page: number) => dispatch(setPageAction(page));

    const { selfView } = useMeetSelector(selectMeetSettings);

    const currentPageCount = selfView ? pageCount : pageCountWithoutSelfView;

    const participants = selfView ? pagedParticipants : pagedParticipantsWithoutSelfView;

    const ButtonIcon = participantSideBarOpen ? IcChevronRight : IcMeetParticipants;

    return (
        <div className="participant-sidebar relative" style={{ '--items-per-page': SCREEN_SHARE_PAGE_SIZE }}>
            <Button
                className="participant-sidebar__toggle absolute bg-weak border-none"
                onClick={() => setParticipantSideBarOpen(!participantSideBarOpen)}
                title={participantSideBarOpen ? c('Action').t`Hide participants` : c('Action').t`Show participants`}
            >
                <ButtonIcon size={6} />
            </Button>
            <div className={clsx('participant-sidebar__list hide-scrollbar', !participantSideBarOpen && 'inactive')}>
                {currentPageCount > 1 && (
                    <div
                        className={clsx(
                            'participant-sidebar__pagination-container absolute flex justify-center items-center w-full z-up',
                            !participantSideBarOpen && 'inactive'
                        )}
                    >
                        <Pagination totalPages={currentPageCount} currentPage={page} onPageChange={setPage} />
                    </div>
                )}
                {participantSideBarOpen &&
                    participants.map((participant) => (
                        <div key={participant.identity} className="participant-sidebar__list__item">
                            <ParticipantTile participant={participant} viewSize="small" />
                        </div>
                    ))}
            </div>
        </div>
    );
};
