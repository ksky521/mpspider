const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const getMdArticle = require('./lib/getMdArticle');
const items = fs.readJSONSync('./.cache/all.json');
const getRelateArticle = require('./lib/getRelateArticle');
const path = require('path');

const cwd = process.cwd();
const _cachePath = path.join(cwd, '.cache');
const filepath = path.join(cwd, 'docs');
const unique = new Set();

items.forEach((item) => {
    item.links = getRelateArticle(item);
    unique.add(item.mid);
});

const relates = [];
items.forEach(({links}) => {
    if (links && links.length) {
        links.forEach((link) => {
            if (!unique.has(link.mid)) {
                relates.push(link);
            }
        });
    }
});

const queue = new Queue(getMdArticle, 2);
relates.forEach(({url, mid, title}, i) => {
    queue.add([mid, url]);
});
queue.run().then((data) => {
    let newData = data.concat(items);
    fs.writeJSONSync(path.join(_cachePath, 'all.json'), newData);
});

console.log(relates);
