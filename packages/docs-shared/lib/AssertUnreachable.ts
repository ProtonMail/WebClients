export function assertUnreachableAndThrow(uncheckedCase: never): never {
  throw Error('Unchecked case ' + uncheckedCase)
}

export function assertUnreachableAndLog(uncheckedCase: never): void {
  console.error('Unchecked case', uncheckedCase)
}
