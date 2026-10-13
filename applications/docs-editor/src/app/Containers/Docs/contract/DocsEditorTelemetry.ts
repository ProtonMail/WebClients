export const DocsEditorTelemetryEvents = {
  table_of_contents_available: 'table_of_contents.available',
  table_of_contents_opened: 'table_of_contents.opened',
  table_of_contents_heading_clicked: 'table_of_contents.heading_clicked',
} as const

export type DocsEditorTelemetryEvent = (typeof DocsEditorTelemetryEvents)[keyof typeof DocsEditorTelemetryEvents]
