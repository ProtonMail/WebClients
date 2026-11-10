/**
 * Homepage telemetry events, reported through the injected `reportTelemetry`.
 * Copied from `TelemetryDocsHomepageEvents` in packages/shared/lib/api/telemetry.ts: keep the values equal, the host
 * passes them on as that enum.
 */
export enum TelemetryEvent {
  document_opened = 'document.opened',
  document_opened_in_trash = 'document.opened_in_trash',
  document_created = 'document.created',
  document_shared = 'document.shared',
  document_trashed = 'document.trashed',
  document_restored = 'document.restored',
  document_permanently_deleted = 'document.permanently_deleted',
  document_renamed = 'document.renamed',
  document_moved = 'document.moved',
  document_source_opened = 'document.source.opened',
  sorting_changed_to_name = 'sorting.changed.to_name',
  sorting_changed_to_time = 'sorting.changed.to_time',
  sorting_changed_to_owner = 'sorting.changed.to_owner',
  sorting_changed_to_location = 'sorting.changed.to_location',
  invite_accepted = 'invite.accepted',
  invite_rejected = 'invite.rejected',
  drive_opened = 'drive.opened',
}

export type ReportTelemetry = (event: TelemetryEvent) => void
