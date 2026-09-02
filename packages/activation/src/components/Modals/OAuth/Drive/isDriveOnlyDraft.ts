import { ImportProvider, ImportType } from '../../../../interface';
import type { OAuthDraftSummary } from '../OAuthModalViews';

/** True when the current import draft is Google → Drive only (Drive's simplified flow). */
export const isDriveOnlyDraft = ({ provider, products }: OAuthDraftSummary) =>
    provider === ImportProvider.GOOGLE && products?.length === 1 && products[0] === ImportType.DRIVE;
