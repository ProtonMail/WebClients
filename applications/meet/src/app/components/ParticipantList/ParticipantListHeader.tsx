import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { useIsWaitingRoomJoinEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMaxParticipants } from '@proton/meet/store/slices/meetingInfo';
import { selectIsWaitingRoomHost } from '@proton/meet/store/slices/waitingRoomSlice';

import { SideBarSearch } from '../SideBarSearch/SideBarSearch';

type Props = {
    isSearchOn: boolean;
    searchExpression: string;
    setSearchExpression: (value: string) => void;
    setIsSearchOn: (value: boolean) => void;
    participantsCount: number;
};

export const ParticipantListHeader = ({
    isSearchOn,
    searchExpression,
    setSearchExpression,
    setIsSearchOn,
    participantsCount,
}: Props) => {
    const isWaitingRoomJoinEnabled = useIsWaitingRoomJoinEnabled();

    const maxParticipants = useMeetSelector(selectMaxParticipants);
    const isWaitingRoomHost = useMeetSelector(selectIsWaitingRoomHost) && isWaitingRoomJoinEnabled;

    return (
        <div className="flex items-center w-full">
            {isSearchOn ? (
                <SideBarSearch
                    searchExpression={searchExpression}
                    setSearchExpression={setSearchExpression}
                    setIsSearchOn={setIsSearchOn}
                    placeholder={c('Placeholder').t`Find...`}
                />
            ) : (
                <div className="text-semibold flex items-center flex-nowrap">
                    <div className="flex items-baseline gap-1 flex-nowrap">
                        <h2 className="text-semibold text-2xl text-ellipsis m-0">{c('Title').t`Participants`}</h2>
                        {!isWaitingRoomHost && (
                            <span className="text-semibold text-sm color-hint text-tabular-nums">
                                {maxParticipants
                                    ? `(${participantsCount}/${maxParticipants})`
                                    : `(${participantsCount})`}
                            </span>
                        )}
                    </div>

                    <Button
                        className="search-open-button p-0 ml-2 flex items-center justify-center shrink-0"
                        shape="ghost"
                        size="small"
                        onClick={() => setIsSearchOn(!isSearchOn)}
                        aria-label={c('Alt').t`Open participants search`}
                    >
                        <IcMagnifier size={6} />
                    </Button>
                </div>
            )}
        </div>
    );
};
