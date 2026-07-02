import { z } from "zod";

const validUrlSchema = z
    .object({
        url: z.string().url({ message: "Invalid URL" }),
    })
    .strict();

export type ValidUrl = z.infer<typeof validUrlSchema>;

export const validateUrl = (input: ValidUrl): URL | null => {
    try {
        const parsedURL = validUrlSchema.parse(input);
        return new URL(parsedURL.url);
    } catch (error) {
        return null;
    }
};

export const normalizeProtocol = (url: URL): string => {
    return url.protocol.toLowerCase();
};
