/**
 * Takes a pathname and replaces its last segment with a new one, preserving the user portion if it exists
 * Example: replaceLastPathSegment('/u/1/foo', 'bar') => '/u/1/bar'
 *          replaceLastPathSegment('/foo', 'bar') => '/bar'
 */
export const replaceLastPathSegment = (pathname: string, newSegment: string): string => {
  const userPortion = pathname.match(/\/u\/\d+/)?.[0]
  return userPortion ? `${userPortion}/${newSegment}` : `/${newSegment}`
}
