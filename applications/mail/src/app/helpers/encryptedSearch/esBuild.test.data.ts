export const normalize = (str: string) =>
    str
        .split('\n')
        .map((line) => line.trimEnd())
        .join(' ');

export const contentWithoutBlockquote = `Main content Random proton employee Proton AG`;

export const contentWithBlocquote = `Main content Random proton employee Proton AG On Thursday, he wrote: This is the previous message`;

export const protonQuote = `
<div>Main content</div>
<div class="protonmail_signature_block-user">
    <div>Random proton employee</div>
    <div>Proton AG</div>
</div>

<div class="protonmail_quote">
    On Thursday, he wrote:<br>
    <blockquote class="protonmail_quote" type="cite">This is the previous message</blockquote>
</div>
`;

export const gmailQuote = `
<div>Main content</div>
<div class="protonmail_signature_block-user">
    <div>Random proton employee</div>
    <div>Proton AG</div>
</div>

<div class="gmail_quote">
    On Thursday, he wrote:<br>
    <blockquote class="gmail_quote" type="cite">This is the previous message</blockquote>
</div>
`;

export const yahooQuote = `
<div>Main content</div>
<div class="protonmail_signature_block-user">
    <div>Random proton employee</div>
    <div>Proton AG</div>
</div>

<div class="yahoo_quoted">
    On Thursday, he wrote:<br>
    <blockquote class="yahoo_quoted" type="cite">This is the previous message</blockquote>
</div>
`;

export const outlookQuote = `
<div>Main content</div>
<div class="protonmail_signature_block-user">
    <div>Random proton employee</div>
    <div>Proton AG</div>
</div>

<div id="divRplyFwdMsg">
    On Thursday, he wrote:<br>
    <blockquote id="divRplyFwdMsg" type="cite">This is the previous message</blockquote>
</div>
`;

export const office365Quote = `
<div>Main content</div>
<div class="protonmail_signature_block-user">
    <div>Random proton employee</div>
    <div>Proton AG</div>
</div>

<div id="3D&quot;divRplyFwdMsg&quot;">
    On Thursday, he wrote:<br>
    <blockquote id="3D&quot;divRplyFwdMsg&quot;" type="cite">This is the previous message</blockquote>
</div>
`;
