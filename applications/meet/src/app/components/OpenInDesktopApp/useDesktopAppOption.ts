import { useFlag } from '@proton/unleash/useFlag';

import { OPEN_DESKTOP_APP_ON_LOAD_FLAG, getDesktopAppOption } from '../../utils/desktopAppDetector';

export const useDesktopAppOption = () => getDesktopAppOption(useFlag(OPEN_DESKTOP_APP_ON_LOAD_FLAG));
