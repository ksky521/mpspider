const fs = require('fs-extra');

const path = require('path');
const pinyin = require('pinyin');

function self(items, docPath, options = {}) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(items)) {
            reject('items is not an Array');
        }
        const map = new Map();
        const unique = new Set();
        // 1. 生成release url，文件名根据拼音转换而成
        items.forEach(item => {
            let title = item.title;
            title = [].concat(...pinyin(title, {style: pinyin.STYLE_NORMAL})).join('_');
            title = title
                .replace(/\//g, '_')
                .replace(/[\(\)\"\'“”‘，「」【】？。；;&\[\]]/g, '')
                .replace(/\s+/g, '-')
                .replace(/^[-_]+|[-_]+$/g, '');
            let release = (item.release = `./${title}.md`);
            item.uri = path.join(docPath, release);
            map.set(item.mid, release);
        });

        const data = [];
        // 2. 替换文章中的文章链接
        items.forEach(item => {
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
# ${item.title.trim()}

${content}
`;

            data.push(item);
        });

        // 3. 生成文章md
        let summary = [];
        if (options && options.summarySort && typeof options.summarySort === 'function') {
            const sort = options.summarySort;
            data = data.sort(sort);
        } else {
            data = data.sort((f, s) => {
                if (f.release > s.release) {
                    return 1;
                }
                return -1;
            });
        }
        data.forEach(item => {
            summary.push(`* [${item.title.trim()}](${item.release.trim()})`);
            fs.writeFileSync(item.uri, item.content);
        });
        // 4. 生成summary。md
        fs.writeFileSync(path.join(docPath, './SUMMARY.md'), summary.join('\n'));
        // 生成 readme
        fs.writeFileSync(
            path.join(docPath, './README.md'),
            `
# 使用 MPSpider 生成的书籍
* mpspider 作者：三水清
* 广告：[nodeppt](https://www.npmjs.com/package/nodeppt) 用 markdown 写出高大上的网页 ppt
`
        );
        // 生成 book.json
        const defaultJson = require('./book.default.json');
        if (options) {
            ['author', 'title', 'description'].forEach(i => {
                if (options[i]) {
                    defaultJson[i] = options[i];
                }
            });
        }
        fs.writeFileSync(path.join(docPath, './book.json'), JSON.stringify(defaultJson, null, 4));
        resolve();
    });
}

module.exports = self;
