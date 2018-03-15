
function getRelateArticle(data) {
    let links = data.links;
    if (links && links.length) {
        links = links.filter((link) => {
            if (!link.mid || !~link.url.indexOf('mp.weixin.qq.com')) {
                return false;
            }
            return true;
        });
    }
    return links;
}

module.exports = getRelateArticle;
