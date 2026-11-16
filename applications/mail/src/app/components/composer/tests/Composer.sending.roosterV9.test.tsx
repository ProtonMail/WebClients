import { useFlag } from '@unleash/proxy-client-react';

import './Composer.sending.test';

// Runs the same suite with the editor on roosterjs 9
jest.mocked(useFlag).mockImplementation((name) => name === 'MailComposerRoosterV9');
