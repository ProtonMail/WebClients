import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Conversation } from './conversation';
import { MessageForSearch } from './encryptedSearch';

export type Element = Conversation | Message | MessageForSearch;
