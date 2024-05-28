import { v4 as uuidv4 } from 'uuid'

export function GenerateUUID(): string {
  return uuidv4()
}