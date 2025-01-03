export const AnonymousUserEmail = 'anonymous-proton@docs.proton.me'
export const AnonymousUserDisplayName = 'Anonymous Proton'

export const AnonymousUserLetters: Record<string, { name: string; hsl: string }> = {
  Σ: { name: 'sigma', hsl: 'hsla(231, 85%, 18%, 1)' },
  α: { name: 'alpha', hsl: 'hsla(198, 80%, 18%, 1)' },
  β: { name: 'beta', hsl: 'hsla(303, 63%, 18%, 1)' },
  γ: { name: 'gamma', hsl: 'hsla(32, 100%, 18%, 1)' },
  δ: { name: 'delta', hsl: 'hsla(23, 25%, 18%, 1)' },
  ε: { name: 'epsilon', hsl: 'hsla(55, 85%, 18%, 1)' },
  ζ: { name: 'zeta', hsl: 'hsla(240, 100%, 18%, 1)' },
  π: { name: 'pi', hsl: 'hsla(120, 52%, 18%, 1)' },
  λ: { name: 'lambda', hsl: 'hsla(0, 100%, 20%, 1)' },
  Ω: { name: 'omega', hsl: 'hsla(300, 100%, 19%, 1)' },
}

export function getRandomAnonymousUserLetter() {
  const random = Math.floor(Math.random() * 10)
  const keys = Object.keys(AnonymousUserLetters)
  const key = keys[random % keys.length]
  const letter = AnonymousUserLetters[key]
  return {
    letter: key,
    ...letter,
  }
}
