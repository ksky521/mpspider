const program = require('commander');
const ora = require('ora');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');

const path = require('path');
program.usage('[options] <url>').option('-p, --path <value>', '输出路径').parse(process.argv);

let docPath = program.path;
const url = program.args[0];
if (!url) {
    console.log('url is empty');
    return;
}
const cwd = process.cwd();

if (docPath) {
    docPath = path.join(cwd, 'docs');
}
const cachePath = path.join(cwd, '.cache');
const imgPath = path.join(docPath, 'imgs');
const imgRelatePath = './imgs';

const cacheName = md5.update(url).digest('hex');
const jsonFilePath = path.join(cachePath, `${cacheName}.json`);
const jsonFileWithImagePath = path.join(cachePath, `${cacheName}-img.json`);

const getList = require('./getList');
const getImages = require('./getImages');
const createBook = require('./createBook');
const unfetchMids = require('./unfetchMids');

// const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

let spinner = ora('Loading').start();

spinner.text = `开始抓取聚合页内容`;

getList(url, jsonFilePath)
    .then((data) => {
        spinner.succeed(`抓取聚合页内容成功，共找到 ${data.length} 篇文章`);

        spinner = ora('Loading').start();
        spinner.text = `开始抓取内容关联文章`;
        return unfetchMids(data, jsonFilePath);
    })
    .then((data) => {
        spinner.succeed(`抓取内容关联文章成功，共找到 ${data.length} 篇文章`);

        spinner = ora('Loading').start();
        spinner.text = `开始抓取图片`;

        return getImages(data, imgPath, imgRelatePath, jsonFileWithImagePath);
    })
    .then((data) => {
        spinner.succeed(`抓取图片成功`);

        spinner = ora('Loading').start();
        spinner.text = `开始生成Gitbook文档`;

        return createBook(data, docPath);
    })
    .then((data) => {
        spinner.succeed(`抓取成功，使用Gitbook看一下吧`);
    })
    .catch((e) => {
        spinner.fail(`fail!`);
        console.log(e);
    });
