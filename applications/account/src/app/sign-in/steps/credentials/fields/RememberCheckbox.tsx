import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import type { RememberPreference } from '../useRememberPreference';

export const RememberCheckbox = ({ remember, disabled }: { remember: RememberPreference; disabled: boolean }) => {
    if (!remember.showCheckbox) {
        return null;
    }
    const learnMoreLink = (
        <Href
            className="color-inherit inline-block link-focus"
            key="learn-more"
            href={getKnowledgeBaseUrl('/keep-me-signed-in')}
        >
            {c('Info').t`Why?`}
        </Href>
    );
    return (
        <div className="flex flex-row items-start">
            <Checkbox
                id="staySignedIn"
                className="mt-2 mr-2"
                checked={remember.persistent}
                onChange={disabled ? noop : remember.toggle}
            />
            <div className="flex-1">
                <Label htmlFor="staySignedIn" className="flex items-center">
                    {c('Label').t`Keep me signed in`}
                </Label>
                <div className="color-weak">{c('Info').jt`Recommended on trusted devices. ${learnMoreLink}`}</div>
            </div>
        </div>
    );
};
