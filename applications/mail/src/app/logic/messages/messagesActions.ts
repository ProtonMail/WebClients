import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { createAction } from '@reduxjs/toolkit';
import { MessageEvent } from '../../models/event';

export const initialize = createAction<Message>('messages/initialize');

export const event = createAction<MessageEvent>('messages/event');
