import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'

export type DocsApiError = {
  code: DocsApiErrorCode
  message: string
}

export class ApiResult<T> {
  constructor(
    protected isSuccess: boolean,
    protected error?: DocsApiError,
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

  getErrorObject(): DocsApiError {
    if (this.isSuccess || this.error === undefined) {
      throw new Error('Cannot get an error of a successful result')
    }

    return this.error
  }

  getErrorMessage(): string {
    if (this.isSuccess || this.error === undefined) {
      throw new Error('Cannot get an error message of a successful result')
    }

    return this.error.message
  }

  static ok<U>(value?: U): ApiResult<U> {
    return new ApiResult<U>(true, undefined, value)
  }

  static fail<U>(error: DocsApiError): ApiResult<U> {
    return new ApiResult<U>(false, error)
  }
}
