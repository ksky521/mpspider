const fs = require('fs-extra');
const path = require('path');
const URL = require('url');
const chalk = require('chalk');
const Queue = require('./lib/Queue');
const getMdArticle = require('./lib/getMdArticle');

function self(data, cachePath, jsonFilePath, spinner, options) {
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

        let count = 0;
        content.forEach(item => {
            try {
                item = item.trim();
                if (item.length < 10) {
                    return;
                }
                let json = JSON.parse(item);
                let data = Array.isArray(json.list) ? json.list : json;
                count += data.length;
                if (Array.isArray(data)) {
                    data.forEach(j => {
                        if (options && options.listFilter && typeof options.listFilter === 'function') {
                            const filter = options.listFilter;
                            // 如果返回是 undefined、false 等，则过滤
                            if (!filter(j)) {
                                return;
                            }
                        }
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
                        queue.add([mid, url, options]);
                    });
                }
            } catch (e) {
                console.log(e);
            }
        });
        if (options && options.listFilter && typeof options.listFilter === 'function') {
            console.log(
                `\n共获取了 ${chalk.yellow.bold(count)} 篇文章，过滤后为 ${chalk.yellow.bold(queue.getLength())} 篇`
            );
        }
        queue.on('progress', (curLength, total) => {
            spinner.text = `开始解析文章列表，进度 ${chalk.yellow.bold(curLength)}/${chalk.green.bold(total)}`;
        });
        queue.run().then(
            data => {
                data = data.filter(item => {
                    return item && item.content;
                });
                if (jsonFilePath) {
                    fs.writeJSONSync(jsonFilePath, data);
                }

                resolve(data);
            },
            e => {
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
