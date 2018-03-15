module.exports = (url) => {
    if (/mid=\d+/.test(url)) {
        return url.match(/mid=(\d+)/)[1];
    }
    return 0;
};
