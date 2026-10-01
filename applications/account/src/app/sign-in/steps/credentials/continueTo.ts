import { c } from 'ttag';

import { continueToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { getContinueToString } from '../../../public/helper';
import type { SignInProps } from '../../wizard/SignInProvider';

/** Where the sign-in leads, shown under the title by the screens that ask for credentials. */
export const getContinueTo = ({ toAppName }: SignInProps) => (toAppName ? getContinueToString(toAppName) : '');

/** The submit button's text: the app the sign-in continues to, when the page names it, or else a plain sign-in. */
export const getSignInText = ({ showContinueTo, toAppName }: Pick<SignInProps, 'showContinueTo' | 'toAppName'>) =>
    showContinueTo && toAppName ? continueToPlanOrAppNameText(toAppName) : c('Action').t`Sign in`;
