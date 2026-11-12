import { c } from 'ttag';

import useLumoInMailPreference from '@proton/components/components/drawer/views/lumoAgent/useLumoInMailPreference';
import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import useLumoModelChoice, { LumoModelChoice } from '../../lumo/useLumoModelChoice';

const LumoModelSetting = () => {
    const [enabled] = useLumoInMailPreference();
    const [choice, setChoice] = useLumoModelChoice();

    if (!enabled) {
        return null;
    }

    const options: { value: LumoModelChoice; name: string; description: string }[] = [
        {
            value: LumoModelChoice.MAX,
            name: `${LUMO_SHORT_APP_NAME} Max`,
            description: c('Description').t`High-performance model for complex tasks`,
        },
        {
            value: LumoModelChoice.LITE,
            name: `${LUMO_SHORT_APP_NAME} Lite`,
            description: c('Description').t`Lightweight model for everyday tasks`,
        },
    ];

    return (
        <QuickSettingsSectionRow
            label={c('Label').t`Model`}
            action={
                <SelectTwo
                    unstyled
                    originalPlacement="bottom-end"
                    // Sized to its content, so each description stays on one line.
                    size={{ width: DropdownSizeUnit.Dynamic, maxWidth: DropdownSizeUnit.Viewport }}
                    value={choice}
                    onValue={setChoice}
                    renderSelected={(selected) => <>{options.find((option) => option.value === selected)?.name}</>}
                    data-testid="mail-quick-settings:lumo-model-select"
                >
                    {options.map((option) => (
                        <Option key={option.value} value={option.value} title={option.name}>
                            <span className="flex flex-column flex-nowrap gap-0.5">
                                <span className="text-sm text-semibold">{option.name}</span>
                                <span className="text-xs color-weak">{option.description}</span>
                            </span>
                        </Option>
                    ))}
                </SelectTwo>
            }
        />
    );
};

export default LumoModelSetting;
