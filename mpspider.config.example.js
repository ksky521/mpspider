module.exports = {
    turndown: {
        rule: {
            code: {
                filter: ['tr'],
                replacement: content => {
                    content = content.trim();
                    if (/`$/.test(content) && /^1/.test(content)) {
                        const rs = content.split(/\n/);
                        const code = rs.splice(rs.length / 2 + 1);
                        const realCode = [];
                        for (let i = 0, len = rs.length; i < len; i++) {
                            if (rs[i].trim() && code[i]) {
                                realCode.push(code[i].replace(/`/g, ''));
                            }
                        }
                        content = `
\`\`\`
${realCode.join('\n')}
\`\`\`
`;
                    }
                    return content;
                }
            }
        }
    },
    afterConverter: content => {
        return content.replace(/<(.+?)>/g, (i, m) => {
            return `&lt;${m}>`;
        });
    }
};
