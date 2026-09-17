import { CAN_USE_DOM } from './canUseDOM'

declare global {
  interface Document {
    documentMode?: string
  }

  interface Window {
    MSStream?: unknown
  }
}

// Keep these in case we need to use them in the future.
// export const IS_WINDOWS: boolean = CAN_USE_DOM && /Win/.test(navigator.platform);
export const IS_CHROME: boolean = CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent)
// export const canUseTextInputEvent: boolean = CAN_USE_DOM && 'TextEvent' in window && !documentMode;
