import type {
  DocumentPropertiesStateInterface,
  DocumentPropertyName,
  DocumentPropertyValues,
} from './DocumentPropertiesStateInterface'

export class DocumentPropertiesState implements DocumentPropertiesStateInterface {
  private values: DocumentPropertyValues = {
    userAccountEmailDocTitleEnabled: false,
    userAccountEmailNotificationsEnabled: false,
    currentDocumentEmailDocTitleEnabled: false,
  }

  private subscribers: Set<(state: DocumentPropertyValues) => void> = new Set()

  subscribe(callback: (state: DocumentPropertyValues) => void) {
    this.subscribers.add(callback)
    callback({ ...this.values })

    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notify() {
    const state = { ...this.values }
    this.subscribers.forEach((callback) => callback(state))
  }

  setProperty<T extends DocumentPropertyName>(property: T, value: DocumentPropertyValues[T]) {
    this.values[property] = value
    this.notify()
  }

  getState(): DocumentPropertyValues {
    return { ...this.values }
  }
}
