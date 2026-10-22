// oxlint-disable-next-line proton/no-extraneous-dependencies -- resolved through the root devDependencies; declaring it here would create a dependency cycle, since eslint-plugin-custom-rules (loaded by @proton/oxlint-config) uses this preset
import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig();
