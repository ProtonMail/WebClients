/** Same as @Result but with a non-string error type */
export class DynamicResult<T, E = unknown> {
  constructor(
    protected isSuccess: boolean,
    protected error?: E,
    protected value?: T,
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

  getErrorObject(): E {
    if (this.isSuccess || this.error === undefined) {
      throw new Error('Cannot get an error of a successful result')
    }

    return this.error
  }

  static ok<U, E>(value?: U): DynamicResult<U, E> {
    return new DynamicResult<U, E>(true, undefined, value)
  }

  static fail<U, E>(error: E): DynamicResult<U, E> {
    if (!error) {
      throw new Error('Attempting to create a failed result without an error')
    }
    return new DynamicResult(false, error)
  }
}
