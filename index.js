const spider = require('spider');
const Queue = require('./lib/Queue');
const getMidFromUrl = require('./lib/getMidFromUrl');
const getMdArticle = require('./lib/getMdArticle');
const path = require('path');
const fs = require('fs-extra');

const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

const cwd = process.cwd();
const _cachePath = path.join(cwd, '.cache');
const filepath = path.join(cwd, 'docs');

spider.Spider(
    url,
    (err, data) => {
        if (!err) {
            let items = data.items;
            const queue = new Queue(getMdArticle, 2);
            items.forEach(({url, mid, title}, i) => {
                queue.add([mid, url]);
            });
            queue.run().then((data) => {
                fs.writeJSONSync(path.join(_cachePath, 'all.json'), data);
            });
        }
        // content = toMd(content, { gfm: true });
        // console.log(title, content);
    },
    {
        items: {
            selector: '#js_content a',
            handler: (dom, $) => {
                let url = dom.attr('href');
                return {
                    mid: getMidFromUrl(url),
                    url,
                    title: dom.text()
                };
            }
        }
    }
);
