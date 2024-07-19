import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from './conversation';
import type { ESMessage } from './encryptedSearch';

export type Element = Conversation | Message | ESMessage;
