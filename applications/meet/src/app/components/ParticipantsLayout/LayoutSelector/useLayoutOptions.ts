import { c } from 'ttag';

import { IcMeetLayoutGallery } from '@proton/icons/icons/IcMeetLayoutGallery';
import { IcMeetLayoutScreenShare } from '@proton/icons/icons/IcMeetLayoutScreenShare';
import { IcMeetLayoutSpeaker } from '@proton/icons/icons/IcMeetLayoutSpeaker';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    ParticipantsLayouts,
    SpotlightSources,
    selectParticipantsLayout,
    selectSpotlightSource,
    setParticipantsLayout,
    setSpotlightSource,
} from '@proton/meet/store/slices/layoutSlice';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';

export const useLayoutOptions = () => {
    const dispatch = useMeetDispatch();

    const participantsLayout = useMeetSelector(selectParticipantsLayout);
    const spotlightSource = useMeetSelector(selectSpotlightSource);
    const isScreenShare = useMeetSelector(selectIsScreenShare);

    const isShowingScreenShare =
        participantsLayout === ParticipantsLayouts.Speaker &&
        spotlightSource === SpotlightSources.ScreenShare &&
        isScreenShare;

    const options = [
        {
            key: 'gallery',
            label: c('Action').t`Gallery`,
            Icon: IcMeetLayoutGallery,
            isSelected: participantsLayout === ParticipantsLayouts.Gallery,
            onSelect: () => dispatch(setParticipantsLayout(ParticipantsLayouts.Gallery)),
        },
        {
            key: 'speaker',
            label: c('Action').t`Speaker`,
            Icon: IcMeetLayoutSpeaker,
            isSelected: participantsLayout === ParticipantsLayouts.Speaker && !isShowingScreenShare,
            onSelect: () => dispatch(setSpotlightSource(SpotlightSources.ActiveSpeaker)),
        },
        ...(isScreenShare
            ? [
                  {
                      key: 'screen-share',
                      label: c('Action').t`Screen share`,
                      Icon: IcMeetLayoutScreenShare,
                      isSelected: isShowingScreenShare,
                      onSelect: () => dispatch(setSpotlightSource(SpotlightSources.ScreenShare)),
                  },
              ]
            : []),
    ];

    return { options, selectedOption: options.find((option) => option.isSelected) ?? options[0] };
};
