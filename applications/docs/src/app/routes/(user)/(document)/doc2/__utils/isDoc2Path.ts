/**
 * Whether the path is doc2's, as `/doc2`, `/doc2/` or `/u/1/doc2`. Free of imports, as the app's entry reads it
 * before it loads either app.
 */
export function isDoc2Path(pathname: string) {
  return /^(\/u\/\d+)?\/doc2\/?$/.test(pathname)
}
