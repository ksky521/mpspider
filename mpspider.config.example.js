module.exports = {
    afterConverter: content => {
        return content.replace(/<(.+?)>/g, (i, m) => {
            return `&lt;${m}>`;
        });
    }
};
