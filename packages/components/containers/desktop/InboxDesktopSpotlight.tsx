import { useRef } from 'react';

import { c } from 'ttag';

import { InboxDesktopLogo, Spotlight } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

interface Props {
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
    children: React.ReactNode;
}

const InboxDestktopSpotlight = ({ children, show, onDisplayed, onClose }: Props) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <Spotlight
            originalPlacement="left-start"
            show={show}
            onDisplayed={onDisplayed}
            onClose={(e) => {
                e.stopPropagation();
                onClose();
            }}
            anchorRef={ref}
            content={
                <div className="flex flex-nowrap">
                    <div className="shrink-0 pr-4">
                        <InboxDesktopLogo />
                    </div>

                    <div>
                        <div className="text-bold text-lg m-auto">{c('Spotlight').t`Get the desktop app`}</div>
                        {c('Spotlight').t`Conveniently launch ${MAIL_APP_NAME} right from your desktop.`}
                    </div>
                </div>
            }
        >
            <div ref={ref} className="w-full">
                {children}
            </div>
        </Spotlight>
    );
};
export default InboxDestktopSpotlight;
