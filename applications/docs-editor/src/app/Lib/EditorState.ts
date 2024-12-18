import { BasePropertiesState, EditorSystemMode } from '@proton/docs-shared'
import { EditorUserMode } from './EditorUserMode'

export type EditorEvent = {
  name: ''
  payload: {}
}

export interface EditorStateValues {
  userMode: EditorUserMode
}

const DefaultValues: Partial<EditorStateValues> = {}

export class EditorState extends BasePropertiesState<EditorStateValues, EditorEvent> {
  constructor(systemMode: EditorSystemMode) {
    super({
      ...DefaultValues,
      userMode: systemMode === EditorSystemMode.Edit ? EditorUserMode.Edit : EditorUserMode.Preview,
    })
  }

  get userMode() {
    return this.getProperty('userMode')
  }

  set userMode(userMode: EditorUserMode) {
    this.setProperty('userMode', userMode)
  }

  get isSuggestionMode() {
    return this.userMode === EditorUserMode.Suggest
  }
}


