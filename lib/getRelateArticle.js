function getRelateArticle(data) {
    if (!data) {
        return [];
    }
    let links = data.links;
    if (links && links.length) {
        links = links.filter(link => {
            if (!link.mid || !~link.url.indexOf('mp.weixin.qq.com')) {
                return false;
            }
            return true;
        });
    }else{
        return [];
    }
    return links;
}

module.exports = getRelateArticle;
