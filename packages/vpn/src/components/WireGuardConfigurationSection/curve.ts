// Thanks DJB https://ed25519.cr.yp.to
// https://tools.ietf.org/html/rfc8032, https://en.wikipedia.org/wiki/EdDSA
// Includes Ristretto https://ristretto.group
// Curve formula is −x² + y² = 1 − (121665/121666) * x² * y²
export const CURVE = (() => {
    try {
        return {
            // Params: a, b
            a: BigInt(-1),
            // Equal to -121665/121666 over finite field.
            // Negative number is P - number, and division is invert(number, P)
            d: BigInt('37095705934669439343138083508754565189542113879843219016388785533085940283555'),
            // Finite field 𝔽p over which we'll do calculations
            P: BigInt(2) ** BigInt(255) - BigInt(19),
            // Subgroup order aka C
            n: BigInt(2) ** BigInt(252) + BigInt('27742317777372353535851937790883648493'),
            // Cofactor
            h: BigInt(8),
            // Base point (x, y) aka generator point
            Gx: BigInt('15112221349535400772501151409588531511454012693041857206046113283949847762202'),
            Gy: BigInt('46316835694926478169428394003475163141307993866256225615783033603165251855960'),
        };
    } catch (e) {
        return null;
    }
})();
