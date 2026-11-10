/**
 * Maximum number of rendered PDF pages sent to the model per request. It is separate from (and smaller
 * than) the budget for uploaded images, so a PDF can never push the user's photos out of the request.
 * Rendering never produces more pages than this, since the rest would be dropped anyway.
 */
export const MAX_PDF_PAGE_IMAGES_PER_REQUEST = 5;
