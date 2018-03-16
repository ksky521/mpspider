const fs = require('fs-extra');
const path = require('path');
const URL = require('url');
const Queue = require('./lib/Queue');
const getMdArticle = require('./lib/getMdArticle');

function self(data, cachePath, jsonFilePath) {
    return new Promise((resolve, reject) => {
        if (!data.nickname) {
            return reject('没有公众号名称');
        }
        const txtPath = path.join(cachePath, `${data.nickname}.txt`);
        // console.log(txtPath);
        if (!fs.existsSync(txtPath)) {
            return reject('找不到抓取后的文章存储文件');
        }
        let content = fs.readFileSync(txtPath, {encoding: 'utf8'});
        if (!content) {
            return reject('抓取后的列表文件打开失败');
        }
        content = content.split('\n');
        if (!content.length) {
            return reject('列表为空');
        }
        let rs = [];
        const queue = new Queue(getMdArticle, 2);

        // let count = 0;
        content.forEach((item) => {
            try {
                item = item.trim();
                if (item.length < 10) {
                    return;
                }
                let json = JSON.parse(item);
                let data = Array.isArray(json.list) ? json.list : json;
                if (Array.isArray(data)) {
                    data.forEach((j) => {
                        let info = j.app_msg_ext_info;
                        if (!info) {
                            return;
                        }
                        let url = info.content_url;
                        url = url.replace(/&amp;/g, '&');
                        let urlObj = URL.parse(url, true);
                        let {mid} = urlObj.query;
                        // count++;
                        // if (count > 10) {
                        //     return;
                        // }
                        // console.log(url);
                        queue.add([mid, url]);
                    });
                }
            } catch (e) {
                console.log(e);
            }
        });

        queue.run().then(
            (data) => {
                data = data.filter((item) => {
                    return item && item.content;
                });
                if (jsonFilePath) {
                    fs.writeJSONSync(jsonFilePath, data);
                }

                resolve(data);
            },
            (e) => {
                reject(e);
            }
        );
    });
}
module.exports = self;

// self(
//     {
//         nickname: 'list'
//     },
//     path.join(__dirname),
//     path.join(__dirname, 'all.json')
// ).then(
//     (data) => {
//         console.log(data);
//     },
//     (e) => {
//         console.log(e);
//     }
// );
