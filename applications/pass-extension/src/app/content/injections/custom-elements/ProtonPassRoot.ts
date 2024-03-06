import { StyledShadowHost } from './StyledShadowHost';

// @ts-ignore
import styles from './ProtonPassRoot.raw.scss';

export class ProtonPassRoot extends StyledShadowHost {
    constructor() {
        super(styles);
    }
}
