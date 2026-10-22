// oxlint-disable-next-line proton/no-extraneous-dependencies -- resolved through the root devDependencies; declaring it here would create a dependency cycle, since @proton/oxlint-config loads this plugin
import { createOxlintConfig } from '@proton/oxlint-config';

export default createOxlintConfig({ preset: 'base' });
