import { useMemo } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useToggle from '@proton/components/hooks/useToggle';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { IconName } from '@proton/icons/types';

import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import SettingsLink from '../link/SettingsLink';
import usePopperAnchor from '../popper/usePopperAnchor';
import { GetStartedButton } from './GetStartedButton';

export type DisplayItem = DropdownDisplayItem | LinkDisplayItem;

export interface DropdownDisplayItem extends DisplayItemBase {
    type: 'dropdown';
    dropdownLinks: { label: string; icon: IconName; href: string }[];
}

export interface LinkDisplayItem extends DisplayItemBase {
    type: 'link';
    linkHref: string;
}

interface DisplayItemBase {
    imgSrc: string;
    title: string;
    description: string;
    type: 'dropdown' | 'link';
    dropdownLinks?: DropdownDisplayItem['dropdownLinks'];
    linkHref?: LinkDisplayItem['linkHref'];
}

const DropdownItem = ({ item, onClick }: { item: DropdownDisplayItem; onClick: () => void }) => {
    const { anchorRef, toggle, close, isOpen } = usePopperAnchor<HTMLElement>();

    return (
        <>
            <Button onClick={toggle} shape="ghost" color="weak">
                <div className="flex flex-nowrap gap-x-2 items-center text-left">
                    <div className="shrink-0">
                        <img src={item.imgSrc} alt="" />
                    </div>
                    <div>
                        <b>{item.title}</b>
                        <br />
                        {item.description}
                    </div>
                    <IcThreeDotsVertical size={6} className="p-0.5 self-center shrink-0" />
                    <div ref={anchorRef as React.RefObject<HTMLDivElement>} />
                </div>
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    {item.dropdownLinks?.map(({ label, icon, href }) => {
                        return (
                            <SettingsLink path={href} className="text-no-decoration" onClick={onClick} key={label}>
                                <DropdownMenuButton className="text-left flex gap-2 items-center">
                                    <Icon name={icon} size={4} />
                                    {label}
                                </DropdownMenuButton>
                            </SettingsLink>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface SpotlightMenuButtonProps {
    initiallyOpen?: boolean;
    items: DisplayItem[];
    header?: React.ReactNode;
    /** Toggles the Spotlight popover. */
    onToggle?: () => void;
    /** Called when clicking on the [x] companion button. */
    onDismiss?: () => void;
}

export const SpotlightMenuButton = ({
    initiallyOpen: initiallyOpen_ = false,
    items: displayItems,
    header,
    onToggle: onToggle,
    onDismiss: onDismiss_,
}: SpotlightMenuButtonProps) => {
    const initiallyOpen = useMemo(() => initiallyOpen_, []);

    const { state: renderSpotlight, toggle: toggleSpotlight, set: setSpotlight } = useToggle(initiallyOpen);

    const closeSpotlight = () => {
        setSpotlight(false);
    };

    const onToggleSpotlight = () => {
        onToggle?.();
        toggleSpotlight();
    };

    const onDismiss = () => {
        onDismiss_?.();
        closeSpotlight();
    };

    return (
        <Spotlight
            originalPlacement="bottom-end"
            closeIcon="cross-big"
            show={renderSpotlight}
            onClose={toggleSpotlight}
            size="large"
            className="w-full"
            innerClassName="px-5 pt-6"
            style={{ maxInlineSize: '37.5rem' }}
            content={
                <>
                    {header}

                    {displayItems.map((item) => {
                        if (item.type === 'dropdown') {
                            return <DropdownItem key={item.title} item={item} onClick={closeSpotlight} />;
                        }
                        return (
                            <ButtonLike
                                key={item.title}
                                as={SettingsLink}
                                path={item.linkHref!}
                                onClick={closeSpotlight}
                                shape="ghost"
                                color="weak"
                            >
                                <div className="flex flex-nowrap gap-x-2 text-left">
                                    <div className="shrink-0">
                                        <img src={item.imgSrc} alt="" />
                                    </div>
                                    <div>
                                        <b>{item.title}</b>
                                        <br />
                                        {item.description}
                                    </div>
                                    <IcChevronRight size={6} className="self-center shrink-0" />
                                </div>
                            </ButtonLike>
                        );
                    })}
                </>
            }
        >
            <GetStartedButton onGetStarted={onToggleSpotlight} onDismiss={onDismiss} />
        </Spotlight>
    );
};
