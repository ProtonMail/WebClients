const moment = require('moment');

module.exports = {
    upstream: 'ProtonMail/Angular',
    dir: '.',
    labels: {
        external: [
            { match: 'Feature', name: 'Added' },
            { match: 'Bug', name: 'Fixed' },
            { match: 'Improvement', name: 'Improved' }
        ],
        local: [{ match: /Hotfix [-~]? ?/, name: 'Changed' }]
    },
    render: {
        group: ({ name, commits }) => {
            return `## ${name}
${commits.join('\n')}
`;
        },
        version: ({ version, date }) => `# [${version.replace('v', '')}] - ${moment(date).format('YYYY-MM-DD')}`,
        commit: ({ title, name }) => `- ${title || name}`
    }
};
