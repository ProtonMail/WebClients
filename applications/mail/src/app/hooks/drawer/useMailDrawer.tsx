import type { DragEvent } from 'react';
import { useEffect, useRef } from 'react';

import CalendarDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/CalendarDrawerAppButton';
import ContactDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/ContactDrawerAppButton';
import LumoDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/LumoDrawerAppButton';
import ReferralAppButton from '@proton/components/components/drawer/drawerAppButtons/ReferralAppButton';
import SecurityCenterDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/SecurityCenterDrawerAppButton';
import VPNDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/VPNDrawerAppButton';
import useLumoInMail from '@proton/components/components/drawer/views/lumoAgent/useLumoInMail';
import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS, DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import FeatureTourDrawerButton from '../../components/drawer/FeatureTourDrawerButton';
import { useMailSelector } from '../../store/hooks';
import { selectDraggingElementsCount } from '../../store/layout/layoutSliceSelectors';
import useMailCalendarCreateEvent from './useMailCalendarCreateEvent';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar, toggleDrawerApp } = useDrawer();
    const canShowFeatureTourDrawerButton = useDisplayFeatureTourDrawerButton();

    const [allowedProducts, loadingAllowedProducts] = useAllowedProducts();
    const isLumoInMailEnabled = useLumoInMail();

    const draggingElementsCount = useMailSelector(selectDraggingElementsCount);
    const isSingleMessageDrag = draggingElementsCount === 1;

    // Handle the Calendar drop handshake (CALENDAR_MAIL_DROP -> resolve message
    // -> CALENDAR_CREATE_EVENT_FROM_MAIL).
    useMailCalendarCreateEvent();

    // Hover-to-open: while a single message is dragged over the Calendar icon,
    // open the drawer after a short delay so the user can drop onto a time slot.
    const calendarIsInView = appInView === APPS.PROTONCALENDAR;
    const hoverOpenTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const openCalendarDrawer = () => {
        if (!calendarIsInView) {
            toggleDrawerApp({ app: APPS.PROTONCALENDAR })();
        }
    };
    const handleCalendarDragEnter = (event: DragEvent) => {
        if (!isSingleMessageDrag) {
            return;
        }
        event.preventDefault();
        if (!hoverOpenTimerRef.current) {
            hoverOpenTimerRef.current = setTimeout(openCalendarDrawer, 300);
        }
    };
    const handleCalendarDragLeave = () => {
        if (hoverOpenTimerRef.current) {
            clearTimeout(hoverOpenTimerRef.current);
            hoverOpenTimerRef.current = undefined;
        }
    };

    // Notify the Calendar drawer (when open) that a Mail drag is active and how
    // many messages it carries, without leaking any message content. Calendar
    // uses this to enable its drop target and later request the actual message.
    useEffect(() => {
        if (!calendarIsInView) {
            return;
        }
        postMessageToIframe(
            {
                type: DRAWER_EVENTS.CALENDAR_MAIL_DRAG_STATE,
                payload: { active: draggingElementsCount > 0, count: draggingElementsCount },
            },
            APPS.PROTONCALENDAR
        );
    }, [calendarIsInView, draggingElementsCount]);

    useEffect(
        () => () => {
            if (hoverOpenTimerRef.current) {
                clearTimeout(hoverOpenTimerRef.current);
            }
        },
        []
    );

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        allowedProducts.has(Product.Calendar) && (
            <span
                className={clsx(isSingleMessageDrag && 'drawer-sidebar-button--drop-target')}
                onDragEnter={handleCalendarDragEnter}
                onDragLeave={handleCalendarDragLeave}
            >
                <CalendarDrawerAppButton
                    aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
                    disabled={loadingAllowedProducts}
                />
            </span>
        ),
        <SecurityCenterDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)} />,
        isLumoInMailEnabled ? (
            <LumoDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView)} />
        ) : undefined,
        <VPNDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.VPN, appInView)} />,
        <ReferralAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.REFERRAL, appInView)} />,
        canShowFeatureTourDrawerButton && <FeatureTourDrawerButton />,
    ].filter(isTruthy);

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
