const fs = require('fs-extra');
const Queue = require('./lib/Queue');
const items = fs.readJSONSync('./.cache/all-img.json');
const writeMd = require('./lib/writeMd');

const path = require('path');
const pinyin = require('pinyin');

const cwd = process.cwd();
const _cachePath = path.join(cwd, '.cache');
const filepath = path.join(cwd, 'docs');
const map = new Map();
const unique = new Set();
// 1. 生成release url
items.forEach((item) => {
    let title = item.title;
    title = [].concat(...pinyin(title, {style: pinyin.STYLE_NORMAL})).join('_');
    title = title.replace(/\//g, '_').replace(/[\(\)\"\']/g, '');
    let release = (item.release = `./${title}.md`);
    item.uri = path.join(filepath, release);
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
fs.writeFileSync(path.join(filepath, './SUMMARY.md'), summary.join('\n'));
