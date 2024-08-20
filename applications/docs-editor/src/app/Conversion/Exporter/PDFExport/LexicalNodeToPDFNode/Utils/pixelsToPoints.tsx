export function pixelsToPoints(pixels: number | undefined | null): number | undefined {
  if (!pixels) {
    return undefined
  }
  return pixels * 0.75
}
