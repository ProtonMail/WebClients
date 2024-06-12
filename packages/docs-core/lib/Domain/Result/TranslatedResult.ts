export class TranslatedResult<T> {
  constructor(
    private isSuccess: boolean,
    private error?: string,
    private value?: T,
  ) {
    Object.freeze(this)
  }

  isFailed(): boolean {
    return !this.isSuccess
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot get value of an unsuccessful result: ${this.error}`)
    }

    return this.value as T
  }

  getTranslatedError(): string {
    if (this.isSuccess || this.error === undefined) {
      throw new Error('Cannot get an error of a successful result')
    }

    return this.error
  }

  static ok<U>(value?: U): TranslatedResult<U> {
    return new TranslatedResult<U>(true, undefined, value)
  }

  static failWithTranslatedError<U>(error: string): TranslatedResult<U> {
    if (!error) {
      throw new Error('Attempting to create a failed result without an error')
    }

    return new TranslatedResult<U>(false, error)
  }
}
