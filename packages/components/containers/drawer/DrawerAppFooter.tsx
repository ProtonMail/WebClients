import { ReactElement, cloneElement, useEffect, useRef } from 'react';

import Footer from '@proton/components/components/footer/Footer';
import { useElementRect, useNotifications } from '@proton/components/hooks';
import throttle from '@proton/utils/throttle';

interface Props {
    buttons: ReactElement[];
}

const DrawerAppFooter = ({ buttons }: Props) => {
    const { setOffset } = useNotifications();
    const ref = useRef<HTMLDivElement>(null);
    const rect = useElementRect(ref);
    const hasFooter = buttons.length > 0;

    useEffect(() => {
        if (!hasFooter || !rect || !ref.current) {
            return;
        }
        const handler = throttle(() => {
            const element = document.elementFromPoint(rect.x, rect.y);
            if (element === ref.current || ref.current?.contains(element)) {
                setOffset({ y: rect.height });
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
    }, [hasFooter, rect?.height]);

    if (!hasFooter) {
        return null;
    }

    // Adding keys to buttons
    const clonedButtons = buttons.map((button, index) =>
        cloneElement(button, { key: button.key || `footer-button-${index}` })
    );

    return (
        <div className="relative" ref={ref}>
            <Footer className="p1 flex-column flex-gap-0-5">{clonedButtons}</Footer>
        </div>
    );
};

export default DrawerAppFooter;
