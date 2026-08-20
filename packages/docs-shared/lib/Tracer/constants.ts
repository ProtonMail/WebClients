export const REPORT_FILE_NAME = 'tracer-report'
export const SESSION_KEY = 'docs-open-tracer-session-id'
export const IGNORE_PATHS = ['/recents', '/trash']

export const LOOP_DETECT_FIRST_THRESHOLD = 3
export const LOOP_DETECT_SECOND_THRESHOLD = 5
export const LOOP_DETECT_THIRD_THRESHOLD = 10

/** Trace event types emitted immediately before a full-page navigation or reload. */
export const LOOP_CAUSE_MAP = {
  boot_docs_url_bar_navigate_to_action: 'navigate_to_action',
  boot_docs_url_bar_is_docs_enabled_false: 'docs_disabled_redirect',
  boot_docs_url_bar_is_sheets_enabled_false: 'sheets_disabled_redirect',
  boot_doc_page_redirect_back_to_public_context: 'reauth_public_redirect',
  boot_doc_viewer_invite_accept_public_redirect: 'invite_accept_public_redirect',
  boot_doc_viewer_invite_accept_reload: 'invite_accept_reload',
  boot_editor_frame_editor_requested_client_reload: 'editor_client_reload',
  boot_editor_frame_editor_content_window_not_available: 'editor_content_window_reload',
  boot_redirect_to_correct_doc_type_if_needed_start: 'correct_doc_type_redirect',
  boot_public_doc_loader_redirect_to_authed_document_start: 'public_to_authed_redirect',
  boot_bootstrap_public_invalid_session_fork: 'invalid_session_fork',
  boot_public_document_copier_open_document_window: 'public_copier_open_window',
} as const
