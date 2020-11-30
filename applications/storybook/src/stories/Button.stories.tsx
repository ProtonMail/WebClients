import React from 'react';
import { PrimaryButton, Button, ErrorButton, LinkButton } from 'react-components';

export default { component: Button, title: 'Proton UI / Button' };

export const Basic = () => <Button>Button</Button>;
export const LoadingButton = () => <Button loading>Button</Button>;
export const Primary = () => <PrimaryButton>Button</PrimaryButton>;
export const Error = () => <ErrorButton>Button</ErrorButton>;
export const Link = () => <LinkButton>Button link</LinkButton>;
