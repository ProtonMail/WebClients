export enum EditorEvent {
  ToolbarClicked = 'toolbar-clicked',
}

export type EditorEventData = {
  [EditorEvent.ToolbarClicked]: undefined
}
