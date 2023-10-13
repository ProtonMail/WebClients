import { useContext } from 'react';

import { PopupContext } from 'proton-pass-extension/lib/components/Context/Popup/PopupContext';

export const usePopupContext = () => useContext(PopupContext);
