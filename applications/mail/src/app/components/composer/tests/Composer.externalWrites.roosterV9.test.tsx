// @vitest-environment jsdom
// jsdom kept: the rooster editor iframe needs iframe.contentDocument, which happy-dom lacks
import { useFlag } from '@unleash/proxy-client-react';

import './Composer.externalWrites.test';

// Runs the same suite with the editor on roosterjs 9
vi.mocked(useFlag).mockImplementation((name) => name === 'MailComposerRoosterV9');
