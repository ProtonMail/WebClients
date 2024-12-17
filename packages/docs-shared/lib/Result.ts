export class Result<T, E = string> {
  constructor(
    private isSuccess: boolean,
    private error?: E,
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

  getError(): E {
    if (this.isSuccess || this.error === undefined) {
      throw new Error('Cannot get an error of a successful result')
    }

    return this.error
  }

  static ok<U, E = string>(value?: U): Result<U, E> {
    return new Result<U, E>(true, undefined, value)
  }

  static fail<U, E = string>(error: E): Result<U, E> {
    if (!error) {
      throw new Error('Attempting to create a failed result without an error')
    }

    return new Result<U, E>(false, error)
  }
}
