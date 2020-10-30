import React from 'react';
import { Meta } from '@storybook/react/types-6-0';
import { PrimaryButton, Button } from 'react-components';

export default { component: Button, title: 'Proton UI / Button' } as Meta;

export const Basic = () => <Button>Button</Button>;
export const Primary = () => <PrimaryButton>Button</PrimaryButton>;
