const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const getMdArticle = require('./lib/getMdArticle');
const getRelateArticle = require('./lib/getRelateArticle');
const unique = new Set();

function self(items, jsonFilePath, options) {
    // const items = fs.readJSONSync('./.cache/all.json');
    return new Promise((resolve, reject) => {
        if (!Array.isArray(items)) {
            reject('items is not an Array');
        }
        _self(items, jsonFilePath);
        function _self(items, jsonFilePath) {
            items.forEach(item => {
                if (item && item.mid && !unique.has(item.mid)) {
                    item.links = getRelateArticle(item);
                    unique.add(item.mid);
                }
            });

            const relates = [];
            items.forEach(({links}) => {
                if (links && links.length) {
                    links.forEach(link => {
                        if (link.mid && !unique.has(link.mid)) {
                            relates.push(link);
                        }
                    });
                }
            });

            if (relates.length !== 0) {
                const queue = new Queue(getMdArticle, 2);
                relates.forEach(({url, mid, title}, i) => {
                    queue.add([mid, url, options]);
                });
                queue.run().then(
                    data => {
                        data = data.filter(item => {
                            return item && item.content;
                        });

                        let newData = data.concat(items);
                        if (jsonFilePath) {
                            fs.writeJSONSync(jsonFilePath, newData);
                        }
                        //递归执行
                        _self(newData, jsonFilePath);
                    },
                    e => {
                        reject(e);
                    }
                );
            } else {
                // 过滤一遍
                let latestUni = new Set();
                let len = items.length;
                items = items.filter(({mid, title}) => {
                    if (!latestUni.has(mid)) {
                        latestUni.add(mid);
                        return true;
                    } else {
                        return false;
                    }
                });
                if (len !== items.length && jsonFilePath) {
                    fs.writeJSONSync(jsonFilePath, items);
                }
                resolve(items);
            }
        }
    });
}

module.exports = self;
