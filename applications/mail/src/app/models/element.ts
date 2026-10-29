import type { Conversation } from '@proton/mail-message/models/conversation';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { ESMessage } from './encryptedSearch';

export type Element = Conversation | Message | ESMessage;
