import { c } from 'ttag';

import { IcFilingCabinet } from '@proton/icons/icons/IcFilingCabinet';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import MobileSection from '../MobileSection';
import MobileSectionRow from '../MobileSectionRow';

export const CategoriesHeader = () => {
    return (
        <MobileSection>
            <MobileSectionRow stackContent>
                <div className="flex flex-column items-center text-center gap-6">
                    <div className="bg-weak rounded-xl p-4">
                        <IcFilingCabinet size={8} />
                    </div>
                    <div className="flex flex-column gap-2">
                        <p className="text-3xl text-semibold m-0">{c('Title').t`Fewer distractions, more focus`}</p>
                        <p className="color-weak m-0">
                            {c('Description')
                                .t`With new email categories, only important messages land in your primary inbox. Categories work just like spam filters. ${MAIL_APP_NAME} never reads your emails or shares your data.`}
                        </p>
                    </div>
                </div>
            </MobileSectionRow>
        </MobileSection>
    );
};
