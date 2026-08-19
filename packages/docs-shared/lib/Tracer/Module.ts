import { GenerateUUID } from '../GenerateUuid'
import metrics from '@proton/metrics'

import Persistence from './Persistence'

const REPORT_FILE_NAME = 'tracer-report'
const SESSION_KEY = 'docs-open-tracer-session-id'
const LOOP_DETECT_THRESHOLD = 2
const IGNORE_PATHS = ['/recents', '/trash']

let isEnabled = false

enum AttemptOutcome {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  LOOP_DETECTED = 'loop_detected',
}

export interface Attempt {
  id: string
  redirectCount: number
  startedAt: number
  updatedAt: number
  resolvedAt: number
  outcome: AttemptOutcome
  dismissed: boolean
}

export interface TracerEvent {
  id: string
  attemptId: string
  timestamp: number
  type: string
  location?: Record<string, unknown>
  payload?: Record<string, unknown>
  redirectEvent: boolean
}

/**
 * Initializes the Tracer module used to detect and report redirect loops in the document opening process.
 * Call this function as early as possible in the application.
 * Each opening of a document will create a new attempt stored in indexedDB.
 * Detailed events can be traced using the `trace` function and will be tied to the attempt.
 */
async function init() {
  if (shouldIgnore()) {
    return
  }

  log('init', 'tracer init...')
  await Persistence.initializeDb()

  const currentAttempt = await getCurrentAttempt()
  if (!currentAttempt) {
    const newAttempt = createNewAttempt()
    log('init', `creating new attempt: ${truncate(newAttempt.id)}`)
    await Persistence.saveAttempt(newAttempt)
    sessionStorage.setItem(SESSION_KEY, newAttempt.id)
    metrics.docs_document_open_redirect_total.increment({ action: 'attempt_started' })
    return
  }

  if (currentAttempt.resolvedAt > 0) {
    log('init', 'attempt already resolved')
    sessionStorage.removeItem(SESSION_KEY)
    return
  }

  await incrementAttemptRedirectCount(currentAttempt)
}

/**
 * Traces an event related to the current document opening attempt.
 * Optional flag to count the event as a redirect in case of react-only (no page reload) redirects.
 */
async function trace(type: string, payload?: Record<string, unknown>, countAsRedirect?: boolean) {
  if (shouldIgnore()) {
    return
  }

  const timestamp = Date.now()
  const locationState = getLocationState()

  const attempt = await getCurrentAttempt()
  if (!attempt) {
    log('trace', `no attempt found, skipping event: ${type}`)
    return
  }

  await Persistence.saveEvent({
    id: GenerateUUID(),
    attemptId: attempt.id,
    timestamp,
    type,
    location: locationState,
    payload,
    redirectEvent: countAsRedirect || false,
  })
  log('trace', `${type}: ${truncate(attempt.id)}`)

  if (countAsRedirect) {
    await incrementAttemptRedirectCount(attempt)
  }
}

/**
 * Marks the current attempt as resolved.
 * Called at the end of the document opening process.
 */
async function resolveAttempt() {
  if (shouldIgnore()) {
    return
  }
  const timestamp = Date.now()
  const attempt = await getCurrentAttempt()
  if (!attempt) {
    log('resolve', 'no attempt found')
    return
  }
  if (attempt.resolvedAt > 0) {
    log('resolve', `attempt already resolved: ${truncate(attempt.id)}`)
    sessionStorage.removeItem(SESSION_KEY)
    return
  }

  // clean document open, throw away session and idb events
  if (attempt.outcome !== AttemptOutcome.LOOP_DETECTED) {
    await Persistence.flushAttempt(attempt.id)
    sessionStorage.removeItem(SESSION_KEY)
    log('resolve', `no loop, flushed: ${truncate(attempt.id)}`)
    return
  }

  // loop detected but document still opened - keep for reporting, mark resolution time
  await Persistence.saveAttempt({
    ...attempt,
    resolvedAt: timestamp,
  })
  await trace('resolve_attempt')
  sessionStorage.removeItem(SESSION_KEY)
  log('resolve', `loop detected with attempt, marking resolution time: ${truncate(attempt.id)}`)
}

async function getReportFile() {
  if (shouldIgnore()) {
    return
  }

  const _attempts = await Persistence.getAllAttempts()
  const attempts = _attempts.filter((attempt) => attempt.outcome === AttemptOutcome.LOOP_DETECTED)
  if (attempts.length === 0) {
    log('download', 'no loop detected attempts found')
    return
  }

  const reports: Record<string, { events: TracerEvent[]; attempt: Attempt }> = {}
  for (const attempt of attempts) {
    const events = await Persistence.getEvents(attempt.id)
    reports[attempt.id] = { events, attempt }
  }

  const filename = `${REPORT_FILE_NAME}-${Date.now()}.json`
  const file = new File([JSON.stringify(reports)], filename, { type: 'application/json' })
  return {
    file,
    filename,
  }
}

/**
 * Downloads a JSON report of all detected attempts and all events associated with them.
 */
async function downloadReport() {
  const result = await getReportFile()
  if (!result) {
    return
  }

  const { file, filename } = result
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)

  log('download', 'report downloaded')
}

/**
 * Flushes the database and removes the session key
 */
async function flush() {
  if (shouldIgnore()) {
    return
  }
  await Persistence.flush()
  sessionStorage.removeItem(SESSION_KEY)
  log('flush', 'db flushed')
}

/**
 * Gets count of undismissed attempts that are loop detected.
 */
async function getUnreportedAttemptsCount() {
  if (shouldIgnore()) {
    return 0
  }
  const attempts = await Persistence.getUndismissedAttempts()
  log('report', `${attempts.length} unreported attempts found`)
  return attempts.length
}

/**
 * Sets the enabled state of the tracer. If disabled, no attempts will be created or reported.
 */
function setEnabled(enabled: boolean) {
  isEnabled = enabled
}

/**
 * Marks all unreported attempts as dismissed.
 */
async function dismissAttempts() {
  if (shouldIgnore()) {
    return
  }
  const attempts = await Persistence.getUndismissedAttempts()
  for (const attempt of attempts) {
    await Persistence.saveAttempt({ ...attempt, dismissed: true })
  }
  log('dismiss', 'attempts dismissed')
}

async function incrementAttemptRedirectCount(attempt: Attempt) {
  if (attempt.resolvedAt > 0) {
    return
  }
  const newRedirectCount = attempt.redirectCount + 1
  const isLoop = newRedirectCount >= LOOP_DETECT_THRESHOLD

  // increment metric for newly detected loops
  if (isLoop && attempt.outcome !== AttemptOutcome.LOOP_DETECTED) {
    metrics.docs_document_open_redirect_total.increment({ action: 'loop_detected' })
  }

  await Persistence.saveAttempt({
    ...attempt,
    outcome: isLoop ? AttemptOutcome.LOOP_DETECTED : AttemptOutcome.IN_PROGRESS,
    redirectCount: newRedirectCount,
  })
  log('redirect', `incrementing redirect count to ${newRedirectCount}: ${truncate(attempt.id)}`)
}

function log(scope: string, message: string) {
  // eslint-disable-next-line no-console
  console.log(`[docs-open-tracer] (${scope}) ${message}`)
}

function truncate(id: string) {
  return id.substring(0, 8)
}

function shouldIgnore() {
  if (!isEnabled) {
    return true
  }
  return IGNORE_PATHS.some((path) => location.pathname.includes(path))
}

function getLocationState() {
  return {
    pathname: location.pathname,
    hash: location.hash ? '[present]' : '',
    linkId: new URLSearchParams(location.search).get('linkId')?.toString(),
    volumeId: new URLSearchParams(location.search).get('volumeId')?.toString(),
    mode: new URLSearchParams(location.search).get('mode')?.toString(),
    token: new URLSearchParams(location.search).get('token')?.toString() ? '[present]' : null,
  }
}

function createNewAttempt(): Attempt {
  return {
    id: GenerateUUID(),
    redirectCount: 0,
    startedAt: Date.now(),
    updatedAt: 0,
    resolvedAt: 0,
    outcome: AttemptOutcome.NEW,
    dismissed: false,
  }
}

async function getCurrentAttempt(): Promise<Attempt | null> {
  const attemptId = sessionStorage.getItem(SESSION_KEY)
  if (!attemptId) {
    return null
  }
  const attempt = await Persistence.getAttempt(attemptId)
  return attempt || null
}

export default {
  init,
  trace,
  resolveAttempt,
  setEnabled,
  downloadReport,
  getReportFile,
  flush,
  dismissAttempts,
  getUnreportedAttemptsCount,
}
