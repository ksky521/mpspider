const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const getImg = require('./lib/getImg');

const getRelateArticle = require('./lib/getRelateArticle');
const path = require('path');

function self(items, imgPath, imgRelatePath = './imgs', jsonPath = '') {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(items)) {
            reject('items is not an Array');
        }

        let rs = [];
        items.forEach((item) => {
            item.content.replace(/!\[\]\((.+?)\)/g, (input, $1) => {
                rs.push($1);
            });
        });

        const queue = new Queue(getImg, 2);
        rs.forEach((url, i) => {
            queue.add([url, imgPath]);
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
                            return `![](${imgRelatePath}/${rs[$1]})`;
                        }
                        return input;
                    });
                    // console.log(content);
                    item.content = content;
                    delete item.links;
                });
                if (jsonPath) {
                    fs.writeJSONSync(jsonPath, items);
                }
                resolve(items, rs.length);
            },
            (e) => {
                reject(e);
            }
        );
    });
}

module.exports = self;
