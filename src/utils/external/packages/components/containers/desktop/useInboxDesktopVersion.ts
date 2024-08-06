import { z } from "zod";
import { RELEASE_CATEGORIES } from "../../../shared/lib/apps/desktopVersions";

export const DesktopVersionSchema = z.object({
    CategoryName: z.enum(Object.values(RELEASE_CATEGORIES) as [string, ...string[]]),
    Version: z.string(),
    ReleaseDate: z.string(),
    File: z.array(
        z.object({
            Identifier: z.string().optional(),
            Url: z.string(),
            Sha512CheckSum: z.string(),
        }),
    ),
    ReleaseNotes: z.array(
        z.object({
            Type: z.string(),
            Notes: z.array(z.string()),
        }),
    ),
    RolloutProportion: z.number(),
    ManualUpdate: z.array(z.string()).optional(),
});

export const VersionFileSchema = z.object({
    Releases: z.array(DesktopVersionSchema),
});

export type DesktopVersion = z.infer<typeof DesktopVersionSchema>;
export type VersionFile = z.infer<typeof VersionFileSchema>;
