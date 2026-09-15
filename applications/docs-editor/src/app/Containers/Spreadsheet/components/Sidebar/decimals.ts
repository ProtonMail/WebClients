import { isNil } from '@rowsncolumns/utils'

// Pre-compile regular expressions
const THOUSAND_REGEX = /(\,[#,0]{3})/gi
const PATTERN_SEPARATOR = ';'
const THOUSAND_PATTERN = ',##0'

/**
 * Change decimals places of a pattern
 * @param pattern
 * @param changeBy
 *
 * https://regex101.com/r/SzttwT/2
 */
const DECIMAL_REGEX = new RegExp(
  // "(?<prefix>[\\d]+)(?<decimal>\\.)?(?<suffix>\\d{1,})?",
  '(?<prefix>[\\d#,]+)(?<decimal>\\.)?(?<suffix>\\d{1,})?',
  'i',
)

const createZeros = (len: number) => {
  return Array.from({ length: len })
    .map(() => `0`)
    .join('')
}

export const changeDecimals = (pattern: string | undefined = '', changeBy: number = 1, delta = true) => {
  const patterns = pattern.split(PATTERN_SEPARATOR)

  return patterns
    .map((p) => {
      const match = p.match(DECIMAL_REGEX)
      if (match && match.groups) {
        const { decimal, suffix } = match.groups
        // There is no decimal point
        if (!decimal) {
          const newDecimals = Math.max(changeBy, 0)
          const zeros = createZeros(newDecimals)
          return p.replace(DECIMAL_REGEX, `$1$2${zeros.length ? '.' + zeros : ''}`)
        }
        let newSuffix = 0
        if (suffix) {
          newSuffix = Math.max(delta ? suffix.length + changeBy : changeBy, 0)
        }
        const zeros = createZeros(newSuffix)
        return p.replace(DECIMAL_REGEX, `$1${zeros.length ? '$2' + zeros : ''}`)
      }

      // Empty pattern
      if (!p) {
        const newDecimals = Math.max(changeBy, 0)
        const zeros = createZeros(newDecimals)
        return `0${zeros.length ? '.' + zeros : ''}`
      }

      return p
    })
    .join(PATTERN_SEPARATOR)
}

export const getCurrentDecimalCountInPattern = (pattern: string | undefined = '') => {
  const patterns = pattern.split(PATTERN_SEPARATOR)
  return Math.max(
    0,
    ...patterns.map((p) => {
      const match = p.match(DECIMAL_REGEX)
      if (match && match.groups) {
        const suffix = match.groups.suffix
        return isNil(suffix) ? 0 : suffix.length
      }
      return 0
    }),
  )
}

// Adds a thousand separator
export const addThousandSeparator = (pattern: string | undefined = '') => {
  if (!pattern) {
    return `#${THOUSAND_PATTERN}`
  }
  const patterns = pattern.split(PATTERN_SEPARATOR)

  return patterns
    .map((p) => {
      const hasThousand = THOUSAND_REGEX.test(p)
      // Ignore if its already has thousand separator
      if (hasThousand) {
        return p
      }
      const decimalIndex = p.indexOf('.')
      if (decimalIndex !== -1) {
        return p.substring(0, decimalIndex) + THOUSAND_PATTERN + p.substring(decimalIndex)
      }
      return p + THOUSAND_PATTERN
    })
    .join(PATTERN_SEPARATOR)
}

export const removeThousandSeparator = (pattern: string | undefined = '') => {
  const patterns = pattern.split(PATTERN_SEPARATOR)

  return patterns
    .map((p) => {
      return p.replace(THOUSAND_REGEX, ``)
    })
    .join(PATTERN_SEPARATOR)
}

export const hasThousandsSeparator = (pattern: string | undefined = '') => {
  return pattern.split(PATTERN_SEPARATOR).some((p) => p.match(THOUSAND_PATTERN))
}
