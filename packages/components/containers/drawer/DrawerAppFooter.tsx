import { ReactElement, cloneElement, useEffect, useRef } from 'react';

import Footer from '@proton/components/components/footer/Footer';
import { useElementRect, useNotifications } from '@proton/components/hooks';
import { modalTwoBackdropRootClassName } from '@proton/shared/lib/busy';
import throttle from '@proton/utils/throttle';

interface Props {
    buttons: ReactElement[];
    offsetNotifications?: boolean;
}

const DrawerAppFooter = ({ buttons, offsetNotifications }: Props) => {
    const { setOffset } = useNotifications();
    const ref = useRef<HTMLDivElement>(null);
    const rect = useElementRect(ref);
    const hasFooter = buttons.length > 0;

    useEffect(() => {
        if (!offsetNotifications || !hasFooter || !rect || !ref.current) {
            setOffset(undefined);
            return;
        }
        const handler = throttle(() => {
            const elements = document.elementsFromPoint(rect.x, rect.y);
            // Ignore the modal backdrop element, assume it's from the modal animation closing out
            const filteredElements = [...elements].filter(
                (element) => !element.classList.contains(modalTwoBackdropRootClassName)
            );
            const element = filteredElements[0];
            if (
                // The drawer footer itself
                element === ref.current ||
                // Any element inside the drawer footer
                ref.current?.contains(element)
            ) {
                const padding = 4;
                setOffset({ y: rect.height + padding });
            } else {
                setOffset(undefined);
            }
        }, 33);
        const observer = new MutationObserver(handler);
        // Observe any changes to the children in body. This is a heuristic to determine when
        // floating elements might be covering the footer.
        observer.observe(document.body, { childList: true });
        return () => {
            observer.disconnect();
        };
    }, [offsetNotifications, hasFooter, rect?.height]);

    if (!hasFooter) {
        return null;
    }

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `footer-button-${index}` })
    );

    return (
        <div className="relative" ref={ref}>
            <Footer className="p-4 flex-column gap-2">{clonedButtons}</Footer>
        </div>
    );
};

export default DrawerAppFooter;
