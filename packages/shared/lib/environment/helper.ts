import { hasBit } from '../helpers/bitset';

export type Environment = 'alpha' | 'beta';

enum EnvironmentBits {
    alpha = 0b100,
    beta = 0b010,
    default = 0b001,
}
// How many bits are allocated. Having one bit per environment, we end up with 3.
// We dynamically calculate that from the enum, and since typescript generates
// a reverse mapping, the value is divided by half.
const maxBits = Object.keys(EnvironmentBits).length / 2;

const getBit = (env?: Environment) => {
    return EnvironmentBits[env as keyof typeof EnvironmentBits] ?? EnvironmentBits.default;
};

export const getResult = <T extends string>(value = 0, environment: Environment | undefined, keys: T[]) => {
    const result: { [key in T]: boolean } = {} as any;
    let modifiedValue = value;
    const environmentBit = getBit(environment);
    for (const key of keys) {
        result[key] = hasBit(modifiedValue, environmentBit);
        modifiedValue >>= maxBits;
    }
    return result;
};
