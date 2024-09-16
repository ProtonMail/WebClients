import { useState } from 'react';

import { Button } from '@proton/atoms';
import { Info, Option, SelectTwo, Toggle } from '@proton/components';
import { QuickSettingsSectionRow } from '@proton/components/components/drawer/views/quickSettings';
import {
    DrawerAppHeadline,
    DrawerAppScrollContainer,
    DrawerAppSection,
} from '@proton/components/components/drawer/views/shared';

import { getTitle } from '../../helpers/title';
import mdx from './QuickSettings.mdx';

export default {
    component: DrawerAppScrollContainer,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value1, setValue1] = useState('ant');
    const [value2, setValue2] = useState('grid');
    const [value3, setValue3] = useState('week');
    const [isChecked1, setIsChecked1] = useState(true);
    const [isChecked2, setIsChecked2] = useState(true);

    return (
        <div className="quickSettings py-2" style={{ width: '280px', 'min-height': '400px' }}>
            <DrawerAppScrollContainer>
                <DrawerAppSection>
                    <QuickSettingsSectionRow
                        label="Select"
                        action={
                            <SelectTwo
                                unstyled
                                originalPlacement="bottom-end"
                                value={value1}
                                onChange={({ value: v }) => setValue1(v)}
                            >
                                <Option title="Ant" value="ant" />
                                <Option title="Zebra" value="zebra" />
                            </SelectTwo>
                        }
                    />
                </DrawerAppSection>
                <DrawerAppSection>
                    <QuickSettingsSectionRow
                        label="Toggle"
                        labelInfo={<Info title="Optional info tooltip" />}
                        action={
                            <Toggle
                                id="toggle-basic"
                                checked={isChecked1}
                                onChange={() => {
                                    setIsChecked1(!isChecked1);
                                }}
                            />
                        }
                    />
                </DrawerAppSection>
                <DrawerAppSection>
                    <DrawerAppHeadline>Optional Headline</DrawerAppHeadline>
                    <QuickSettingsSectionRow
                        label="Layout"
                        action={
                            <SelectTwo
                                unstyled
                                originalPlacement="bottom-end"
                                value={value2}
                                onChange={({ value: v }) => setValue2(v)}
                            >
                                <Option title="Grid" value="grid" />
                                <Option title="Row" value="row" />
                            </SelectTwo>
                        }
                    />
                    <QuickSettingsSectionRow
                        label="View"
                        action={
                            <SelectTwo
                                unstyled
                                originalPlacement="bottom-end"
                                value={value3}
                                onChange={({ value: v }) => setValue3(v)}
                            >
                                <Option title="Day" value="day" />
                                <Option title="Week" value="week" />
                                <Option title="Month" value="month" />
                            </SelectTwo>
                        }
                    />

                    <QuickSettingsSectionRow
                        label="Toggle"
                        action={
                            <Toggle
                                id="toggle-basic2"
                                checked={isChecked2}
                                onChange={() => {
                                    setIsChecked2(!isChecked2);
                                }}
                            />
                        }
                    />
                </DrawerAppSection>

                <Button onClick={() => {}} className="shrink-0 text-sm mx-auto" shape="ghost" color="norm">
                    Action
                </Button>
            </DrawerAppScrollContainer>
        </div>
    );
};
