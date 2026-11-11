import { useFlag } from '@proton/unleash/useFlag';

import { OPEN_LINKS_IN_DESKTOP_APP_FLAG, getDesktopAppOption } from '../../utils/desktopAppDetector';

export const useDesktopAppOption = () => getDesktopAppOption(useFlag(OPEN_LINKS_IN_DESKTOP_APP_FLAG));
