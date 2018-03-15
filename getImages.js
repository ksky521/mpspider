const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const getImg = require('./lib/getImg');

const items = fs.readJSONSync('./.cache/all.json');
const getRelateArticle = require('./lib/getRelateArticle');
const path = require('path');
const cwd = process.cwd();
const filepath = path.join(cwd, 'docs/imgs');
const _cachePath = path.join(cwd, '.cache');

let rs = [];
items.forEach((item) => {
    item.content.replace(/!\[\]\((.+?)\)/g, (input, $1) => {
        rs.push($1);
    });
});

const queue = new Queue(getImg, 2);
rs.forEach((url, i) => {
    queue.add([url, filepath]);
});

rs = {};
queue.run().then(
    (data) => {
        data.forEach((d) => {
            rs[d.url] = d.name;
        });
        items.forEach((item) => {
            let content = item.content.replace(/!\[\]\((.+?)\)/g, (input, $1) => {
                if (rs[$1]) {
                    return `![](./imgs/${rs[$1]})`;
                }
                return input;
            });
            // console.log(content);
            item.content = content;
            delete item.links;
        });
        fs.writeJSONSync(path.join(_cachePath, 'all-img.json'), items);
    },
    (a) => {
        console.log(a);
    }
);
