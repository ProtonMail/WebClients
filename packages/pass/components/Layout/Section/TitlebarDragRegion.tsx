import { createPortal } from 'react-dom';

import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';

import './TitlebarDragRegion.scss';

export const TitlebarDragRegion = () =>
    isElectronOnMac
        ? createPortal(<div className="pass-titlebar-drag-region" aria-hidden="true" />, document.body)
        : null;
