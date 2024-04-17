import { Icon } from '@proton/components/components';
import { SettingsSectionTitle, SettingsSectionWide } from '@proton/components/containers/account';
import corruptedPreviewSvg from '@proton/styles/assets/img/errors/warning-storage.svg';

import { PlanConfigStorage } from './interface';

const ReminderSectionStorage = ({ title, warning, quotaWarning }: PlanConfigStorage) => {
    return (
        <SettingsSectionWide className="container-section-sticky-section">
            <SettingsSectionTitle className="mb-8">{title}</SettingsSectionTitle>
            <div
                className="rounded p-2 flex flex-nowrap gap-2 mb-8 max-w-custom"
                style={{ backgroundColor: 'var(--signal-danger-minor-1)', '--max-w-custom': '46em' }}
            >
                <Icon name="exclamation-circle-filled" className="shrink-0 my-auto color-danger" />
                <span className="flex-1 py-2">{warning}</span>
            </div>

            <div className="flex gap-4 items-center">
                <div className="shrink-0 w-full lg:w-1/2">
                    {quotaWarning.map(({ title, description }) => (
                        <div key={title}>
                            <p>{title}</p>
                            <ul>
                                {description.map(({ text, id }) => (
                                    <li key={id}>{text}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <img src={corruptedPreviewSvg} alt="" className="mx-auto md:mx-0" />
            </div>
        </SettingsSectionWide>
    );
};

export default ReminderSectionStorage;
