
const path = require('path');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');

const fs = require('fs-extra');
const program = require('commander');
const ora = require('ora');

const cwd = process.cwd();

program.usage('[options] <url>').option('-p, --path <value>', '输出路径').parse(process.argv);

let docPath = program.path;
const url = program.args[0];
if (!url) {
    console.log('url is empty');
    return;
}

if (!docPath) {
    docPath = path.join(cwd, 'docs');
}

const cachePath = path.join(docPath, '.cache');
const imgPath = path.join(docPath, 'imgs');

//创建文件夹
fs.ensureDirSync(imgPath);
fs.ensureDirSync(cachePath);

const imgRelatePath = './imgs';

const cacheName = md5.update(url).digest('hex');
const jsonFilePath = path.join(cachePath, `${cacheName}.json`);
const jsonFileWithImagePath = path.join(cachePath, `${cacheName}-img.json`);

const getList = require('./getList');
const getImages = require('./getImages');
const createBook = require('./createBook');
const unfetchMids = require('./unfetchMids');

// const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

let spinner = ora('开始抓取聚合页内容').start();


getList(url, jsonFilePath)
    .then((data) => {
        spinner.succeed(`抓取聚合页内容成功，共找到 ${data.length} 篇文章`);

        spinner = ora('开始抓取内容关联文章').start();
        return unfetchMids(data, jsonFilePath);
    })
    .then((data) => {
        spinner.succeed(`抓取内容关联文章成功，共找到 ${data.length} 篇文章`);

        spinner = ora('开始抓取图片').start();

        return getImages(data, imgPath, imgRelatePath, jsonFileWithImagePath);
    })
    .then((data) => {
        spinner.succeed(`抓取图片成功`);

        spinner = ora('开始生成Gitbook文档').start();

        return createBook(data, docPath);
    })
    .then((data) => {
        spinner.succeed(`抓取成功，使用Gitbook看一下吧`);
        console.log(`
        进入${docPath}，执行gitbook serve看结果
        `)
    })
    .catch((e) => {
        spinner.fail(`fail!`);
        console.log(e);
    });
