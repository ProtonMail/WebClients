import { createCommand } from 'lexical'

export const INPUT_EVENT_COMMAND = createCommand<Event>('INPUT_EVENT_COMMAND')
export const BEFOREINPUT_EVENT_COMMAND = createCommand<InputEvent>('BEFORE_INPUT_EVENT_COMMAND')

export const COMPOSITION_START_EVENT_COMMAND = createCommand<CompositionEvent>('COMPOSITION_START_EVENT_COMMAND')

export const INSERT_FILE_COMMAND = createCommand<File | Blob>('INSERT_FILE_COMMAND')
