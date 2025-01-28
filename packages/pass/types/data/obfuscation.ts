import type { Tagged } from '@proton/pass/types/utils';
import type { XorObfuscation } from '@proton/pass/utils/obfuscate/xor';

export enum DeobfuscateMode {
    AUTO,
    MANUAL,
}

export type ObfuscatedItemProperty<Mode extends DeobfuscateMode = DeobfuscateMode> = Tagged<XorObfuscation, Mode>;

export type Obfuscate<T, Auto extends keyof T, Manual extends keyof T> = Omit<T, Auto | Manual> & {
    [Obf in Auto]: ObfuscatedItemProperty<DeobfuscateMode.AUTO>;
} & { [Obf in Manual]: ObfuscatedItemProperty<DeobfuscateMode.MANUAL> };

export type Deobfuscate<T, Mode extends DeobfuscateMode = DeobfuscateMode> = {
    [K in keyof T]: T[K] extends ObfuscatedItemProperty<Mode> ? string
    : T[K] extends ArrayBuffer ? T[K]
    : T[K] extends (infer U)[] ? Deobfuscate<U, Mode>[]
    : T[K] extends {} ? Deobfuscate<T[K], Mode>
    : T[K];
};
