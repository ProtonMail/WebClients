import { useContext } from 'react';

import { PopupContext } from '../context/popup/PopupContext';

export const usePopupContext = () => useContext(PopupContext);
