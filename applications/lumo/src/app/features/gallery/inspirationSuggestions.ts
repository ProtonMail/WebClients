import { c } from 'ttag';

import animatedBoy12 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/animatedboy12.png';
import beigeCouch17 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/beigecouch17.png';
import bluePainting21 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/bluepainting21.png';
import brownWood19 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/brownwood19.png';
import fastCar3 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/fastcar3.png';
import futureHand13 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/futurehand13.png';
import greenFuture10 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/greenfuture10.png';
import greenHill11 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/greenhill11.png';
import orangeBoard22 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/orangeboard22.png';
import orangeFace15 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/orangeface15.png';
import purpleAbstract9 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/purpleabstract9.png';
import purpleCircle8 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/purplecircle8.png';
import purpleGlass1 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/purpleglass1.png';
import purpleIce7 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/purpleice7.png';
import purpleLaptop20 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/purplelaptop20.png';
import tealHeadset14 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/tealheadset14.png';
import whiteCloud23 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/whitecloud23.png';
import whiteFlower4 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/whiteflower4.png';
import whiteHouse18 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/whitehouse18.png';
import whiteShirt5 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/whiteshirt5.png';
import yellowBlock2 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/yellowblock2.png';
import yellowNumber16 from '@proton/styles/assets/img/lumo/lumo-image-inspiration/yellownumber16.png';

export type InspirationSuggestion = {
    id: string;
    img: string;
    getPrompt: () => string;
};

export const INSPIRATION_SUGGESTIONS: InspirationSuggestion[] = [
    {
        id: 'purpleglass1',
        img: purpleGlass1,
        // translator: Prompt sent to the AI for the purple glass inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Abstract glass background design, translucent glass morphism style, smooth flowing shapes and layered glass panels, soft refraction and light dispersion, purple and deep violet dominant color palette, blended with rich blue tones and subtle accents of warm yellow light, cinematic lighting, ultra soft gradients, glossy and frosted glass textures, depth and blur effects, minimal but premium aesthetic, high resolution, 3D rendered, modern tech UI background, elegant and futuristic atmosphere`,
    },
    {
        id: 'yellowblock2',
        img: yellowBlock2,
        // translator: Prompt sent to the AI for the yellow block inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`A striking monochromatic study in yellow — just a fragment of contemporary architecture emerging from its equally golden surroundings, with tonal shifts alone carving out the geometric surfaces and lending the scene its quiet sense of depth and form.`,
    },
    {
        id: 'fastcar3',
        img: fastCar3,
        // translator: Prompt sent to the AI for the fast car inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Raw speed distilled into a single frame — the F1 car tearing across tarmac with motion blur streaking everything behind it, sparks flickering off the surface and carbon fiber catching the light at that visceral low angle right down on the asphalt.`,
    },
    {
        id: 'whiteflower4',
        img: whiteFlower4,
        // translator: Prompt sent to the AI for the white flower inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`A dreamy close-up of flowers swept into soft radial trails by rotating camera motion, where the center blooms in crisp detail while petals dissolve outward into creamy bokeh under gentle natural light.`,
    },
    {
        id: 'whiteshirt5',
        img: whiteShirt5,
        // translator: Prompt sent to the AI for the white shirt inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Photorealistic white T-shirt mockup hanging on a wall inside a modern boutique clothing store, blank white premium cotton T-shirt displayed neatly on a wooden hanger, mounted against a soft pastel-colored wall (light beige, blush pink, or sage green), stylish retail interior in the background with clothing racks and shelves softly blurred, natural daylight mixed with warm ambient store lighting, realistic fabric texture and folds, clean minimal aesthetic, high-end fashion merchandising, shallow depth of field, centered composition, commercial apparel mockup, blank T-shirt ready for custom design placement, ultra-realistic, high resolution, 8k.`,
    },
    {
        id: 'purpleice7',
        img: purpleIce7,
        // translator: Prompt sent to the AI for the purple ice inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Abstract frozen ice background in soft pastel lavender and light purple tones, translucent crystalline ice textures, subtle frost patterns, glowing icy surface, smooth gradients, sparkling frozen details, ethereal winter atmosphere, clean and minimal design, soft lighting, elegant luxury aesthetic, high resolution, dreamy frozen landscape, delicate reflections, ultra-detailed, background only, no objects, no text.`,
    },
    {
        id: 'purplecircle8',
        img: purpleCircle8,
        // translator: Prompt sent to the AI for the purple circle inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Abstract composition of translucent glass shapes floating in space, soft refraction and reflection, smooth curved forms, frosted and clear glass mix, pastel lighting with subtle purple and blue tones, minimalist design, premium modern aesthetic, soft shadows, ultra clean background, high resolution, 3D render style.`,
    },
    {
        id: 'purpleabstract9',
        img: purpleAbstract9,
        // translator: Prompt sent to the AI for the purple abstract inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Abstract minimalist background, soft light purple and pastel yellow color palette, smooth gradient transitions, flowing organic shapes, subtle glow, airy and modern aesthetic, clean composition, gentle light effects, high-end design, soft depth, elegant and dreamy atmosphere, ultra-high resolution.`,
    },
    {
        id: 'greenfuture10',
        img: greenFuture10,
        // translator: Prompt sent to the AI for the green future inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Abstract futuristic background with flowing horizontal ribbon waves, layered luminous bands, soft neon green and cyan gradients, smooth organic curves, subtle motion blur, glossy depth, dark high-contrast backdrop, dynamic light streaks, modern tech aesthetic, clean geometric rhythm, cinematic glow, ultra-detailed digital art, premium UI background, 3D render.`,
    },
    {
        id: 'greenhill11',
        img: greenHill11,
        // translator: Prompt sent to the AI for the green hill inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Aerial photograph of rolling agricultural hills forming smooth, wave-like patterns across a vast landscape. The fields are divided into soft gradients of green and golden yellow, suggesting different crops or stages of growth. Long, curved tractor tracks trace elegant lines through the terrain, emphasizing the rhythm and geometry of the land. Warm sunlight casts gentle shadows across the contours, enhancing depth and texture. Minimalist composition, highly detailed natural patterns, serene and atmospheric, captured in a cinematic landscape photography style with soft contrast and rich natural color tones.`,
    },
    {
        id: 'animatedboy12',
        img: animatedBoy12,
        // translator: Prompt sent to the AI for the animated boy inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`3D animated character in a high-quality family film style, expressive face, large emotional eyes, soft subsurface skin, stylized proportions, vibrant colors, detailed hair and clothing, cinematic lighting, shallow depth of field, friendly and charming personality, ultra polished render, studio-quality animation still.`,
    },
    {
        id: 'futurehand13',
        img: futureHand13,
        // translator: Prompt sent to the AI for the future hand inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Futuristic abstract background, neon green and blue gradient, smooth organic shapes, subtle glow, ethereal atmosphere, clean composition, gentle light effects, high-end design, soft depth, elegant and dreamy atmosphere, ultra-high resolution.`,
    },
    {
        id: 'tealheadset14',
        img: tealHeadset14,
        // translator: Prompt sent to the AI for the teal headset inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Ethereal portrait of a person wearing a sleek dark VR headset, body dissolving into a glowing cyan-teal haze. Centered composition, uniform saturated teal-blue gradient background, backlit silhouette with luminous rim lighting on the headset and fingertips. One hand loosely clenched, the other reaching forward palm-out. Futuristic sci-fi atmosphere, minimalist and dreamlike, digital art style, shallow depth of field.`,
    },
    {
        id: 'orangeface15',
        img: orangeFace15,
        // translator: Prompt sent to the AI for the orange face inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Heavily blurred, out of focus surreal profile portrait. Vibrant neon gradient with bright orange, hot pink, and deep electric blue. High contrast, heavy film grain, minimalist abstract aesthetic.`,
    },
    {
        id: 'yellownumber16',
        img: yellowNumber16,
        // translator: Prompt sent to the AI for the yellow number inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Minimalist op-art graphic of the number "5" formed by a distorted halftone grid blurred. Black dots varying in size create a 3D bulging illusion on a vibrant solid yellow background. Clean vector aesthetic, high contrast, mathematical pattern distortion.`,
    },
    {
        id: 'beigecouch17',
        img: beigeCouch17,
        // translator: Prompt sent to the AI for the beige couch inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`A warm and cozy Japandi-style living room, minimalist aesthetic, cream sectional sofa, neutral and mustard throw pillows, woven pouf, large textured area rug with fringe, minimalist botanical wall art, large indoor palm plant, soft ambient golden lighting, candles, serene and peaceful atmosphere, photorealistic, interior design photography.`,
    },
    {
        id: 'whitehouse18',
        img: whiteHouse18,
        // translator: Prompt sent to the AI for the white house inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Modern two-story minimalist white villa with rounded edges, large sliding glass doors, and a swimming pool. Minimalist patio furniture, mediterranean vibe, architectural photography style, bright sunny day.`,
    },
    {
        id: 'brownwood19',
        img: brownWood19,
        // translator: Prompt sent to the AI for the brown wood inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Close-up texture of polished cross-section tree trunk, intricate swirling growth rings, detailed cracks and wood grain, warm brown and amber tones, natural organic pattern, high resolution.`,
    },
    {
        id: 'purplelaptop20',
        img: purpleLaptop20,
        // translator: Prompt sent to the AI for the purple laptop inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Back view silhouette of a woman with hair tied up typing on a laptop. Dark purple screen, clean light purple background, high-contrast studio lighting, minimalist tech mockup style.`,
    },
    {
        id: 'bluepainting21',
        img: bluePainting21,
        // translator: Prompt sent to the AI for the blue painting inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Minimalist Asian ink wash painting style. A winding white path trails along a mountain ridge covered in deep blue and indigo trees, fading into a heavy white fog. A vibrant, textured solid red sun hangs in the upper right. Surreal, serene, and high-contrast composition.`,
    },
    {
        id: 'orangeboard22',
        img: orangeBoard22,
        // translator: Prompt sent to the AI for the orange board inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Top-down minimalist aerial shot of a long orange surfboard floating on clear blue water. The water has rolling, curved wave contours and bright, shimmering caustic light patterns. A soft shadow is cast directly beneath the board, creating a clean, serene, and modern aesthetic.`,
    },
    {
        id: 'whitecloud23',
        img: whiteCloud23,
        // translator: Prompt sent to the AI for the white cloud inspiration card
        getPrompt: () =>
            c('collider_2025:Inspiration suggestion prompt')
                .t`Hyper-realistic voluminous fluffy white clouds, dense and soft textures, minimalist pale blue gradient sky, soft cinematic lighting, clean aesthetic, ethereal and peaceful mood, studio 3D render style, 8k resolution`,
    },
];
