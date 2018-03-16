const path = require('path');
const URL = require('url');

module.exports = {
    parseUrl(url) {
        url = url.replace(/&amp;/g, '&');
        return URL.parse(url, true);
    }
};


