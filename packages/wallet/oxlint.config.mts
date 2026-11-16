import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({ overrides: [refObjectNullOverride] });
