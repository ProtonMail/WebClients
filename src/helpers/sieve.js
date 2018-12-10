/**
 * Template for Sieve scripts.
 * @type {{'2': String, '1': String=}} map between specific version and template.
 */
export const templates = {
    2: `require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*", 
spamtest :value "ge" :comparator "i;ascii-numeric" "\${1}")
{
    return;
}


`
};
