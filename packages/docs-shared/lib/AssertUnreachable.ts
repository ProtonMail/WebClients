export function assertUnreachable(uncheckedCase: never): never {
  throw Error('Unchecked case ' + uncheckedCase)
}
