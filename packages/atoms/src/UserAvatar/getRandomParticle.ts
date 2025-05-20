export const AnonymousUserParticles: Record<string, string> = {
    μ: 'hsla(198, 80%, 18%, 1)',
    τ: 'hsla(303, 63%, 18%, 1)',
    ν: 'hsla(32, 100%, 18%, 1)',
    γ: 'hsla(23, 25%, 18%, 1)',
    Λ: 'hsla(55, 85%, 18%, 1)',
    Σ: 'hsla(240, 100%, 18%, 1)',
    Ξ: 'hsla(120, 52%, 18%, 1)',
    Ω: 'hsla(0, 100%, 20%, 1)',
    π: 'hsla(300, 100%, 19%, 1)',
};

export function getRandomParticle() {
    const random = Math.floor(Math.random() * 10);
    const keys = Object.keys(AnonymousUserParticles);
    const particle = keys[random % keys.length];
    const hsl = AnonymousUserParticles[particle];
    return {
        name: particle,
        color: { hsl },
    };
}
