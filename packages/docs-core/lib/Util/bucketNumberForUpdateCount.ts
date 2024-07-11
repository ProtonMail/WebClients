export function metricsBucketNumberForUpdateCount(count: number): '10s' | '100s' | '1000s' {
  if (count < 100) {
    return '10s'
  }

  if (count < 1000) {
    return '100s'
  }

  return '1000s'
}
