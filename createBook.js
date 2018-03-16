const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const writeMd = require('./lib/writeMd');

const path = require('path');
const pinyin = require('pinyin');

function self(items, docPath) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(items)) {
            reject('items is not an Array');
        }
        const map = new Map();
        const unique = new Set();
        // 1. 生成release url，文件名根据拼音转换而成
        items.forEach((item) => {
            let title = item.title;
            title = [].concat(...pinyin(title, {style: pinyin.STYLE_NORMAL})).join('_');
            title = title.replace(/\//g, '_').replace(/[\(\)\"\'“‘「」\[\]]/g, '').replace(/\s+/g, '-');
            let release = (item.release = `./${title}.md`);
            item.uri = path.join(docPath, release);
            map.set(item.mid, release);
        });

        const data = [];
        // 2. 替换文章中的文章链接
        items.forEach((item) => {
            if (unique.has(item.mid) && item.content.length < 100) {
                return;
            }
            unique.add(item.mid);

            let content = item.content;
            content = content.replace(/\(http.+?mid=(\d+).+?\)/g, (input, $1) => {
                let rl = map.get($1);
                if (rl) {
                    return `(${rl})`;
                }
                return input;
            });

            item.content = `
    # ${item.title}
    
    ${content}
    `;

            data.push(item);
        });

        // 3. 生成文章md
        let summary = [];
        data.forEach((item) => {
            summary.push(`* [${item.title}](${item.release})`);
            fs.writeFileSync(item.uri, item.content);
        });
        // 4. 生成summary。md
        fs.writeFileSync(path.join(docPath, './SUMMARY.md'), summary.join('\n'));
        resolve();
    });
}

module.exports = self;
