import type { Tagged } from '@proton/pass/types/utils';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';

/** Deobfuscation strategy modes */
export enum DeobfuscateMode {
    /** When `AUTO`, deobfuscation should be automatic
     * without requiring user interaction */
    AUTO,
    /** When `MANUAL`, deobfuscation should only happen
     * after user interaction. This protects against
     * mem-dumps when sensitive fields should be hidden */
    MANUAL,
}

export type ObfuscatedItemProperty<Mode extends DeobfuscateMode = DeobfuscateMode> = Tagged<XorObfuscation, Mode>;

/** Transforms `T` by converting `Auto` keys to auto-deobfuscatable properties
 * and `Manual` keys to manually-deobfuscatable properties. This enforces type
 * safety with regards to obfuscated fields, particularly for `Manual` fields
 * that require user action to deobfuscate (eg: credit-card fields). */
export type Obfuscate<T, Auto extends keyof T, Manual extends keyof T> = Omit<T, Auto | Manual> & {
    [Obf in Auto]: ObfuscatedItemProperty<DeobfuscateMode.AUTO>;
} & { [Obf in Manual]: ObfuscatedItemProperty<DeobfuscateMode.MANUAL> };

/** Recursively transforms obfuscated item properties back to their original type.
 * Converts ObfuscatedItemProperty<Mode> to string and recursively processes
 * arrays and objects while preserving other types. The `Mode` type parameter
 * allows creating intermediary types with partially deobfuscated data. */
export type Deobfuscate<T, Mode extends DeobfuscateMode = DeobfuscateMode> = {
    [K in keyof T]: T[K] extends ObfuscatedItemProperty<Mode> ? string
    : T[K] extends ArrayBuffer ? T[K]
    : T[K] extends (infer U)[] ? Deobfuscate<U, Mode>[]
    : T[K] extends {} ? Deobfuscate<T[K], Mode>
    : T[K];
};
