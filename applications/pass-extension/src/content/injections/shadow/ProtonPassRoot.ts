import { StyledShadowHost } from './StyledShadowHost';

import cssStyles from './ProtonPassRoot.raw.scss';

export class ProtonPassRoot extends StyledShadowHost {
    constructor() {
        super(cssStyles);
    }
}
