import { useMemo } from 'react';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import TopNavbarListItemButton, {
    type TopNavbarListItemButtonProps,
} from '@proton/components/components/topnavbar/TopNavbarListItemButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useToggle from '@proton/components/hooks/useToggle';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import ButtonGroup from '../button/ButtonGroup';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import usePopperAnchor from '../popper/usePopperAnchor';

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
                    <IcThreeDotsVertical
                        ref={anchorRef as any}
                        size={6}
                        className="p-0.5 self-center shrink-0"
                    />
                </div>
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    {item.dropdownLinks?.map(({ label, icon, href }) => {
                        return (
                            <AppLink to={href} className="text-no-decoration" onClick={onClick} key={label}>
                                <DropdownMenuButton className="text-left flex gap-2 items-center">
                                    <Icon name={icon} size={4} />
                                    {label}
                                </DropdownMenuButton>
                            </AppLink>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

interface SpotlightMenuButtonProps {
    initiallyOpen?: boolean;
    buttonIcon: TopNavbarListItemButtonProps<'button'>['icon'];
    buttonText: TopNavbarListItemButtonProps<'button'>['text'];
    items: DisplayItem[];
    header?: React.ReactNode;
    footer?: React.ReactNode;
    /** Toggles the Spotlight popover. */
    onToggle?: () => void;
    /** Called when clicking on the [x] companion button. */
    onDismiss?: () => void;
    /** The hover text for the dismiss button. */
    dismissTitle?: string;
}

export const SpotlightMenuButton = ({
    initiallyOpen: initiallyOpen_ = false,
    items: displayItems,
    buttonText,
    buttonIcon,
    header,
    footer,
    onToggle: onToggle,
    onDismiss: onDismiss_,
    dismissTitle = 'Dismiss',
}: SpotlightMenuButtonProps) => {
    const { viewportWidth } = useActiveBreakpoint();

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
                                as={AppLink}
                                to={item.linkHref!}
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

                    {footer}
                </>
            }
        >
            <ButtonGroup className="mx-3">
                <TopNavbarListItemButton
                    as="button"
                    shape="outline"
                    color="weak"
                    type="button"
                    title={buttonText}
                    className={clsx('topnav-org-setup', viewportWidth['<=medium'] && 'button-for-icon')}
                    onClick={onToggleSpotlight}
                    icon={buttonIcon}
                    text={buttonText}
                />
                <TopNavbarListItemButton
                    as="button"
                    shape="outline"
                    color="weak"
                    type="button"
                    title={dismissTitle}
                    className={clsx({ 'button-for-icon': viewportWidth['<=medium'] })}
                    onClick={onDismiss}
                    icon={<IcCross className="m-0" />}
                />
            </ButtonGroup>
        </Spotlight>
    );
};
