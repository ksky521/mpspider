const path = require('path');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');
const EventEmitter = require('events').EventEmitter;

const fs = require('fs-extra');
const program = require('commander');
const ora = require('ora');

const cwd = process.cwd();
program.command('article <url>').option('-d, --dest <value>', '输出路径').action((url, cmd) => {
    let docPath = cmd.dest;

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
        `);
        })
        .catch((e) => {
            spinner.fail(`fail!`);
            console.log(e);
        });
});

program.command('proxy').option('-d, --dest <value>', '输出路径').option('-p, --port <value>', '代理端口号').action((cmd) => {
    let docPath = cmd.dest;
    let port = cmd.port || 8001;
    if (!docPath) {
        docPath = path.join(cwd, 'docs');
    }

    const cachePath = path.join(cwd, docPath, '.cache');
    const imgPath = path.join(cwd, docPath, 'imgs');

    //创建文件夹
    fs.ensureDirSync(imgPath);
    fs.ensureDirSync(cachePath);

    const imgRelatePath = './imgs';

    const cacheName = md5.update(Date.now() + '').digest('hex');
    const jsonFilePath = path.join(cachePath, `${cacheName}.json`);
    const jsonFileWithImagePath = path.join(cachePath, `${cacheName}-img.json`);

    const anyproxySpider = require('./proxySpider');
    const dealMPList = require('./dealMPList');
    const getImages = require('./getImages');
    const createBook = require('./createBook');
    const unfetchMids = require('./unfetchMids');

    // const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

    let spinner = ora('启动anyproxy抓取').start();
    const event = new EventEmitter();
    event
        .on('anyproxy_ready', (port) => {
            spinner.succeed('启动anyproxy成功，手机设置代理后，打开公众号「查看历史文章」');
            spinner = ora('等待抓取中...\n').start();
        })
        .on('anyproxy_home', (name) => {
            spinner.succeed('检测到公众号历史文章列表');
            spinner = ora('提取中...请勿微信关闭页面！\n').start();
        })
        .on('anyproxy_nickname', (name) => {
            spinner.succeed(`公众号名称「${name}」`);
            spinner = ora('提取中...请勿微信关闭页面！\n').start();
        });

    anyproxySpider(event, cachePath, port)
        .then((data) => {
            spinner.succeed(`抓取「${data.nickname}」文章列表结束`);
            spinner = ora('开始解析文章列表').start();
            return dealMPList(data, cachePath, jsonFilePath);
        })
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
        `);
            event.emit('stop');
        })
        .catch((e) => {
            if (e === 'rootCA') {
                spinner.fail('请配置https证书');
            } else {
                spinner.fail('fail!');
                console.log(e);
            }
            event.emit('stop');
        });
});
program.parse(process.argv);
