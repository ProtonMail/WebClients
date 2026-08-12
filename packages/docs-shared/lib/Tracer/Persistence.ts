import { openDB } from 'idb'
import type { IDBPDatabase, DBSchema } from 'idb'
import type { Attempt, TracerEvent } from './Module'

const DB_NAME = 'docs-open-tracer'
const DB_VERSION = 1

interface TracerDB extends DBSchema {
  attempts: {
    key: string
    value: Attempt
    indexes: { byStartedAt: number }
  }
  events: {
    key: string
    value: TracerEvent
    indexes: { byAttemptId: string }
  }
}

let connection: IDBPDatabase<TracerDB> | null = null

async function initializeDb() {
  if (!connection) {
    connection = await openDB(DB_NAME, DB_VERSION, {
      upgrade: (db) => {
        if (!db.objectStoreNames.contains('attempts')) {
          const attempts = db.createObjectStore('attempts', { keyPath: 'id' })
          attempts.createIndex('byStartedAt', 'startedAt')
        }
        if (!db.objectStoreNames.contains('events')) {
          const events = db.createObjectStore('events', { keyPath: 'id' })
          events.createIndex('byAttemptId', 'attemptId')
        }
      },
    })
  }
  return connection
}

function connectDb() {
  if (!connection) {
    throw new Error('Database not initialized')
  }
  return connection
}

async function saveAttempt(attempt: Attempt) {
  const db = await connectDb()
  const updatedAttempt: Attempt = {
    ...attempt,
    updatedAt: Date.now(),
  }
  await db.put('attempts', updatedAttempt)
}

async function saveEvent(event: TracerEvent) {
  const db = await connectDb()
  await db.put('events', event)
}

async function getAllAttempts() {
  const db = await connectDb()
  const attempts = await db.getAll('attempts')
  return attempts
}

async function getAttempt(attemptId: string) {
  const db = await connectDb()
  const attempt = await db.get('attempts', attemptId)
  return attempt
}

async function getUndismissedAttempts() {
  const allAttempts = await getAllAttempts()
  return allAttempts.filter((attempt) => attempt.outcome === 'loop_detected' && !attempt.dismissed)
}

async function getEvents(attemptId: string) {
  const db = await connectDb()
  return db.getAllFromIndex('events', 'byAttemptId', attemptId)
}

async function flushAttempt(attemptId: string) {
  const db = await connectDb()
  const events = await getEvents(attemptId)
  for (const event of events) {
    await db.delete('events', event.id)
  }
  await db.delete('attempts', attemptId)
}

async function flush() {
  const db = await connectDb()
  await db.clear('attempts')
  await db.clear('events')
}

export default {
  initializeDb,
  saveAttempt,
  saveEvent,
  getAllAttempts,
  getUndismissedAttempts,
  getAttempt,
  getEvents,
  flushAttempt,
  flush,
}
