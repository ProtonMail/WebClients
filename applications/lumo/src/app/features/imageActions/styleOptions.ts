export type StyleOption = {
    id: string;
    label: string;
    prompt: string;
};

export const IMAGE_STYLE_OPTIONS: StyleOption[] = [
    {
        id: 'oil-painting',
        label: 'Oil painting',
        prompt: 'Reimagine this image as a rich oil painting with visible brushstrokes and warm tones',
    },
    {
        id: 'watercolor',
        label: 'Watercolor',
        prompt: 'Reimagine this image as a soft watercolor painting with flowing, translucent colors',
    },
    {
        id: 'anime',
        label: 'Anime',
        prompt: 'Reimagine this image in a detailed anime illustration style',
    },
    {
        id: 'pencil-sketch',
        label: 'Pencil sketch',
        prompt: 'Reimagine this image as a detailed pencil sketch with fine line work and shading',
    },
    {
        id: 'vintage',
        label: 'Vintage photo',
        prompt: 'Reimagine this image as a vintage photograph with faded colors and film grain',
    },
    {
        id: 'comic',
        label: 'Comic book',
        prompt: 'Reimagine this image as a bold comic book illustration with strong outlines and flat colors',
    },
];
