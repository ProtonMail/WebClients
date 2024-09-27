import { z } from 'zod';

const zUnixTime = z.number();

const zDefaultProtocolActual = z.object({
    isDefault: z.boolean(),
    wasChecked: z.boolean(),
});
export type DefaultProtocolActual = z.infer<typeof zDefaultProtocolActual>;

export const UNCHECKED_PROTOCOL: DefaultProtocolActual = {
    isDefault: false,
    wasChecked: false,
};

const zDefaultProtocolStored = z.object({
    shouldBeDefault: z.boolean(),
    wasDefaultInPast: z.boolean(),
    lastReport: z.object({
        wasDefault: z.boolean(),
        timestamp: zUnixTime,
    }),
});
export type DefaultProtocolStored = z.infer<typeof zDefaultProtocolStored>;

export const zDefaultProtocol = zDefaultProtocolActual.merge(zDefaultProtocolStored);

export type DefaultProtocol = z.infer<typeof zDefaultProtocol>;

const zDefaultProtocolsStored = z.object({
    mailto: zDefaultProtocolStored,
});

export type DefaultProtocolsStored = z.infer<typeof zDefaultProtocolsStored>;
export const parseDefaultProtocolsStored = (data: unknown): DefaultProtocolsStored =>
    zDefaultProtocolsStored.parse(data);

export type PROTOCOLS = keyof DefaultProtocolsStored;
