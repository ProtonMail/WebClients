import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components/index';
import { IcGrid3 } from '@proton/icons/icons/IcGrid3';
import { IcPresentationScreen } from '@proton/icons/icons/IcPresentationScreen';
import { IcUser } from '@proton/icons/icons/IcUser';
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
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../../atoms/CircleButton/CircleButton';

export const LayoutSelector = () => {
    const dispatch = useMeetDispatch();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const participantsLayout = useMeetSelector(selectParticipantsLayout);
    const spotlightSource = useMeetSelector(selectSpotlightSource);
    const isScreenShare = useMeetSelector(selectIsScreenShare);

    const isShowingScreenShare =
        participantsLayout === ParticipantsLayouts.Speaker &&
        spotlightSource === SpotlightSources.ScreenShare &&
        isScreenShare;

    const options = [
        {
            key: 'grid',
            label: c('Action').t`Grid`,
            Icon: IcGrid3,
            isSelected: participantsLayout !== ParticipantsLayouts.Speaker,
            onSelect: () => dispatch(setParticipantsLayout(ParticipantsLayouts.Grid)),
        },
        {
            key: 'speaker',
            label: c('Action').t`Speaker`,
            Icon: IcUser,
            isSelected: participantsLayout === ParticipantsLayouts.Speaker && !isShowingScreenShare,
            onSelect: () => dispatch(setSpotlightSource(SpotlightSources.ActiveSpeaker)),
        },
        ...(isScreenShare
            ? [
                  {
                      key: 'screen-share',
                      label: c('Action').t`Screen share`,
                      Icon: IcPresentationScreen,
                      isSelected: isShowingScreenShare,
                      onSelect: () => dispatch(setSpotlightSource(SpotlightSources.ScreenShare)),
                  },
              ]
            : []),
    ];

    const SelectedIcon = options.find((option) => option.isSelected)?.Icon ?? IcGrid3;

    return (
        <>
            <CircleButton
                anchorRef={anchorRef}
                IconComponent={SelectedIcon}
                onClick={toggle}
                variant={isOpen ? 'active' : 'default'}
                ariaLabel={c('Action').t`Change layout`}
                ariaExpanded={isOpen}
                ariaHasPopup="menu"
                tooltipTitle={c('Action').t`Change layout`}
                size={4}
                buttonStyle={{
                    '--circle-button-size': '2.5rem',
                    'padding-block': 0,
                    'padding-inline': 0,
                }}
            />
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="meet-radius">
                <DropdownMenu>
                    {options.map(({ key, label, Icon, isSelected, onSelect }) => (
                        <DropdownMenuButton
                            key={key}
                            className={clsx(
                                'text-left flex flex-nowrap items-center gap-2 border-none shrink-0',
                                isSelected && 'text-semibold'
                            )}
                            aria-pressed={isSelected}
                            onClick={() => {
                                onSelect();
                                close();
                            }}
                        >
                            <Icon size={4} className="shrink-0" />
                            {label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
