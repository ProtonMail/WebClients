/**
 * Action types for gallery prompt suggestions:
 * - 'prompt': navigate to chat with the prompt pre-filled and auto-submitted
 * - 'sketch': open the sketch canvas so the user can draw, then generate from that drawing
 * - 'edit_image': pre-fill the prompt AND trigger the file upload dialog so the user provides a base image
 */
export type SuggestionAction = 'prompt' | 'sketch' | 'edit_image';

export type GalleryPromptSuggestion = {
    id: string;
    icon: string;
    title: string;
    prompt: string;
    previewGradient: string;
    action: SuggestionAction;
    /** Shown below the title on edit_image and sketch cards to explain the extra step */
    hint?: string;
};

export const GALLERY_PROMPT_SUGGESTIONS: GalleryPromptSuggestion[] = [
    {
        id: 'caricature',
        icon: '🎨',
        title: 'Caricature trend',
        prompt: 'Create a fun comic-style caricature portrait with exaggerated features in vibrant colors',
        previewGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        action: 'edit_image',
    },
    {
        id: 'sketch-to-image',
        icon: '✏️',
        title: 'Sketch to image',
        prompt: 'Generate a detailed, polished image based on my sketch',
        previewGradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
        action: 'sketch',
        hint: 'Opens the sketch canvas',
    },
    {
        id: 'flower-petals',
        icon: '🌸',
        title: 'Flower petals',
        prompt: 'A beautiful portrait composed entirely of delicate flower petals in soft pastel pink and white tones',
        previewGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        action: 'prompt',
    },
    {
        id: 'style-transfer',
        icon: '🖼️',
        title: 'Style transfer',
        prompt: 'Reimagine my photo as a Renaissance oil painting with rich textures, warm tones, and dramatic lighting',
        previewGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        action: 'edit_image',
        hint: 'Upload a photo to transform',
    },
    {
        id: 'crayon',
        icon: '🖍️',
        title: 'Crayon drawing',
        prompt: 'Generate an image of a charming hand-drawn crayon illustration with bright colors, playful textures, and childlike creativity',
        previewGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        action: 'prompt',
    },
    {
        id: 'paparazzi',
        icon: '📸',
        title: 'Paparazzi moment',
        prompt: 'A dramatic celebrity red carpet moment with bright camera flashes, glamorous outfits, and Hollywood atmosphere',
        previewGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        action: 'edit_image',
    },
    {
        id: 'background-swap',
        icon: '🌅',
        title: 'Background swap',
        prompt: 'Replace the background of my photo with a stunning golden-hour sunset over mountain peaks',
        previewGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        action: 'edit_image',
        hint: 'Upload a photo to edit',
    }
];
