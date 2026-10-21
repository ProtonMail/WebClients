import { c } from 'ttag';

export type StyleOption = {
    id: string;
    label: string;
    prompt: string;
};

export const getImageStyleOptions = (): StyleOption[] => [
    {
        id: 'oil-painting',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Oil painting`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt')
            .t`Reimagine this image as a rich oil painting with visible brushstrokes and warm tones`,
    },
    {
        id: 'watercolor',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Watercolor`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt')
            .t`Reimagine this image as a soft watercolor painting with flowing, translucent colors`,
    },
    {
        id: 'anime',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Anime`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt').t`Reimagine this image in a detailed anime illustration style`,
    },
    {
        id: 'pencil-sketch',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Pencil sketch`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt')
            .t`Reimagine this image as a detailed pencil sketch with fine line work and shading`,
    },
    {
        id: 'vintage',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Vintage photo`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt')
            .t`Reimagine this image as a vintage photograph with faded colors and film grain`,
    },
    {
        id: 'comic',
        // translator: Image style option in the image editor.
        label: c('collider_2025:Label').t`Comic book`,
        // translator: Editable instruction asking the assistant to change an image\'s artistic style.
        prompt: c('collider_2025:Prompt')
            .t`Reimagine this image as a bold comic book illustration with strong outlines and flat colors`,
    },
];
