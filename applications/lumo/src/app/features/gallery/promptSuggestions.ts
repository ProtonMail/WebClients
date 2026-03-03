import { c } from 'ttag';

import lumoPlushie from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-plushie.png';
import lumoCookie from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-cookie.png';
import lumoCaricature from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-caricature.png';
import lumoRenaissance from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-renaissance.png';
import lumoCubism from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-cubism.png';
import lumoPackage from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-package.png';
import lumoImpressionist from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-impressionist.png';
import lumoModern from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-modern.png';
import lumoSketch from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-sketch.png';

/**
 * Action types for gallery prompt suggestions:
 * - 'prompt': navigate to chat with the prompt pre-filled and auto-submitted
 * - 'sketch': open the sketch canvas so the user can draw, then generate from that drawing
 * - 'edit_image': pre-fill the prompt AND trigger the file upload dialog so the user provides a base image
 */
export type SuggestionAction = 'prompt' | 'sketch' | 'edit_image';

export type GalleryPromptSuggestion = {
    id: string;
    img: string;
    title: string;
    prompt: string;
    action: SuggestionAction;
    hint?: string;
};

/**
 * Returns the gallery prompt suggestions with translated UI strings.
 * Defined as a function so translations are resolved at call time.
 */
export function getGalleryPromptSuggestions(): GalleryPromptSuggestion[] {
    return [
        {
            id: 'caricature',
            img: lumoCaricature,
            // translator: Card title for a caricature image suggestion
            title: c('collider_2025:Gallery suggestion title').t`Comic Caricature`,
            prompt:
                'Transform this photo into a playful comic-style caricature. ' +
                'Exaggerate distinctive facial features for comic effect, use bold clean outlines, ' +
                'and apply vibrant saturated colours in a modern cartoon illustration style. ' +
                'Keep the likeness clearly recognisable while making it fun and expressive.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to caricature`,
        },
        {
            id: 'plushy',
            img: lumoPlushie,
            // translator: Card title for a plush-toy image suggestion
            title: c('collider_2025:Gallery suggestion title').t`Plushie Transformation`,
            prompt:
                'Convert the subject in this photo into an adorable soft plush toy. ' +
                'Give it a fuzzy fabric texture, rounded child-safe proportions, button or embroidered eyes, ' +
                'and visible stitching details along the seams. ' +
                'The result should look like a premium collectible stuffed character ready to be sold in a gift shop.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to plushify`,
        },
        {
            id: 'style-renaissance',
            img: lumoRenaissance,
            // translator: Card title for a Renaissance portrait suggestion
            title: c('collider_2025:Gallery suggestion title').t`Renaissance Portrait`,
            prompt:
                'Reimagine this as a classical Renaissance oil painting in the style of the 15th–16th century Italian masters. ' +
                'Use rich impasto textures, dramatic chiaroscuro lighting with a dark background, ' +
                'warm amber and umber tones, and the dignified, composed posture typical of formal portraiture. ' +
                'The result should feel as though it hangs in a European museum.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to transform`,
        },
        {
            id: 'style-modern',
            img: lumoModern,
            // translator: Card title for a Bauhaus/modern art suggestion
            title: c('collider_2025:Gallery suggestion title').t`Bauhaus Modern Art`,
            prompt:
                'Reinterpret this in a Bauhaus-inspired modern art style. ' +
                'Break the subject into bold geometric shapes and flat planes of colour drawn from the primary palette — ' +
                'red, yellow, blue, black, and white. ' +
                'Use clean sharp lines, minimal ornamentation, and a balanced, grid-like composition that reflects the "form follows function" philosophy.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to transform`,
        },
        {
            id: 'sketch',
            img: lumoSketch,
            // translator: Card title for a sketch-to-image suggestion
            title: c('collider_2025:Gallery suggestion title').t`Sketch to Reality`,
            prompt:
                'Transform my rough hand-drawn sketch into a finished, photorealistic image. ' +
                'Infer the intended subject from the sketch lines, add realistic lighting and shadows, ' +
                'apply natural textures and materials, and produce a sharp, detailed final image ' +
                'that looks like a professional photograph of the sketched concept.',
            action: 'sketch',
            // translator: Short hint shown on the card, telling the user to draw a sketch
            hint: c('collider_2025:Gallery suggestion hint').t`Draw a sketch to bring to life`,
        },
        {
            id: 'style-cubism',
            img: lumoCubism,
            // translator: Card title for a Cubism art style suggestion
            title: c('collider_2025:Gallery suggestion title').t`Cubist Deconstruction`,
            prompt:
                'Reimagine this in the style of Analytical Cubism as pioneered by Picasso and Braque circa 1910. ' +
                'Fragment the subject into overlapping geometric planes and facets, ' +
                'show multiple perspectives simultaneously on a single flat picture plane, ' +
                'and restrict the palette to muted earth tones — ochres, greys, and raw umber.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to transform`,
        },
        {
            id: 'style-impressionist',
            img: lumoImpressionist,
            // translator: Card title for an Impressionist painting suggestion
            title: c('collider_2025:Gallery suggestion title').t`Impressionist Painting`,
            prompt:
                'Recreate this as a French Impressionist painting in the manner of Monet or Renoir. ' +
                'Apply loose, visible brushstrokes that capture the transient quality of light, ' +
                'use a luminous palette of broken colour with soft edges between tones, ' +
                'and emphasise the atmospheric mood and sense of movement over precise detail.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to transform`,
        },
        {
            id: 'style-package',
            img: lumoPackage,
            // translator: Card title for a product packaging suggestion
            title: c('collider_2025:Gallery suggestion title').t`Product Packaging`,
            prompt:
                'Using the provided image of the subject, create a professional retail toy packaging design for a collectible character. ' +
                'The packaging is a glossy blister pack attached to a colourful cardboard backing. ' +
                'The character is displayed inside a clear moulded plastic shell, centred and fully visible. ' +
                'Include 1–2 small accessories arranged neatly beside the character inside the blister. ' +
                'The style should feel modern, polished, and retail-ready — similar to high-end collectible toys found in major stores. ' +
                'Use soft studio lighting, clean reflections on the plastic, subtle shadows under the blister, and a slightly rounded die-cut card shape. ' +
                'The final image should look like a real product photo on a neutral background, front-facing, sharp, and professional.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to package`,
        },
        {
            id: 'style-cookie',
            img: lumoCookie,
            // translator: Card title for a decorated cookie suggestion
            title: c('collider_2025:Gallery suggestion title').t`Decorated Cookie`,
            prompt:
                'Transform this image into a beautifully decorated artisan sugar cookie. ' +
                'Apply a smooth flood of royal icing as the base, then add fine piped details, ' +
                'delicate line work, and hand-painted accents that reproduce the original subject faithfully. ' +
                'The lighting should be soft and even, the icing surface slightly glossy, ' +
                'and the overall result should look like a piece from a high-end custom bake studio.',
            action: 'edit_image',
            // translator: Short hint shown on the card, prompting the user to upload a photo
            hint: c('collider_2025:Gallery suggestion hint').t`Upload a photo to transform`,
        },
    ];
}
