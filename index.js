#!/usr/bin/env node
const chalk = require('chalk');
const path = require('path');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');
const EventEmitter = require('events').EventEmitter;

const fs = require('fs-extra');
const program = require('commander');
const ora = require('ora');

const packageJson = require('./package.json');
const cwd = process.cwd();

program.version(packageJson.version, '-v --version').usage('<command> [options]');

program
    .command('article <url>')
    .option('-d, --dest <value>', '输出路径')
    .action((url, cmd) => {
        let docPath = cmd.dest;
        // 获取 mpspider.config.js
        const options = getMpSpiderConfigFile();
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

        getList(url, jsonFilePath, options)
            .then(data => {
                spinner.succeed(`抓取聚合页内容成功，共找到 ${chalk.yellow.bold(data.length)} 篇文章`);

                spinner = ora('开始抓取内容关联文章').start();
                return unfetchMids(data, jsonFilePath, options);
            })
            .then(data => {
                spinner.succeed(`抓取内容关联文章成功，共找到 ${chalk.yellow.bold(data.length)} 篇文章`);

                spinner = ora('开始抓取图片').start();

                return getImages(data, imgPath, imgRelatePath, jsonFileWithImagePath, options);
            })
            .then(data => {
                spinner.succeed(`抓取图片成功`);

                spinner = ora('开始生成Gitbook文档').start();

                return createBook(data, docPath, options);
            })
            .then(data => {
                spinner.succeed(`抓取成功，使用Gitbook看一下吧`);
                completeMessage(docPath);
            })
            .catch(e => {
                spinner.fail(`fail!`);
                console.log(e);
            });
    });

program
    .command('proxy')
    .option('-d, --dest <value>', '输出路径')
    .option('-p, --port <value>', '代理端口号')
    .option('-V, --verbose', '是否显示 anyproxy log')

    .action(cmd => {
        const options = getMpSpiderConfigFile();
        options.anyproxy = options.anyproxy || {};
        options.anyproxy.silent = !cmd.verbose;
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

        const address = require('address');

        const anyproxySpider = require('./proxySpider');
        const dealMPList = require('./dealMPList');
        const getImages = require('./getImages');
        const createBook = require('./createBook');
        const unfetchMids = require('./unfetchMids');

        // const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

        let spinner = ora('启动anyproxy抓取').start();
        const event = new EventEmitter();

        let totalCount = 0;
        event
            .on('anyproxy_ready', port => {
                spinner.succeed(
                    `启动代理成功，按照下面方式设置代理，然后打开公众号「${chalk.yellow.bold('查看历史文章')}」`
                );
                console.log(`  代理ip：${chalk.yellow.bold(address.ip())}，端口号：${chalk.yellow.bold(port)}`);
                console.log(`  访问 http://localhost:8002，查看代理访问日志`);
                spinner.start('等待抓取中...');
            })
            .on('anyproxy_home', name => {
                spinner.succeed('检测到公众号历史文章列表');
                spinner.start('提取中...请勿微信关闭页面！');
            })
            .on('anyproxy_nickname', name => {
                spinner.succeed(`公众号名称「${name}」`);
                spinner.start('提取中...请勿微信关闭页面！');
            })
            .on('progress', data => {
                // 监听页面注入js发出的请求，然后在rule里面拦截请求，发送event事件
                if (data.curPage) {
                    spinner.color = 'green';
                    let count = parseInt(data.count, 10);
                    if (count && !isNaN(count)) {
                        totalCount += count;
                    }
                    spinner.text = `提取中...请勿微信关闭页面！进度 → 第 ${chalk.yellow.bold(
                        data.curPage
                    )} 页，得到 ${chalk.yellow.bold(totalCount)} 条`;
                }
            })
            .on('pageshow', () => {
                console.log(chalk.red.bold('    又连上了！继续爬！'));
            })
            .on('pagehide', () => {
                console.log(chalk.red.bold('    好像微信关闭或者屏幕不亮了...检查下吧'));
            });

        anyproxySpider(event, cachePath, port, options)
            .then(data => {
                spinner.succeed(`抓取「${chalk.yellow.bold(data.nickname)}」文章列表结束`);
                return dealMPList(data, cachePath, jsonFilePath, spinner, options);
            })
            .then(data => {
                spinner.succeed(`抓取聚合页内容成功，共找到 ${chalk.yellow.bold(data.length)} 篇文章`);

                spinner = ora('开始抓取内容关联文章').start();
                return unfetchMids(data, jsonFilePath, options);
            })
            .then(data => {
                spinner.succeed(`抓取内容关联文章成功，去重后得到 ${chalk.yellow.bold(data.length)} 篇文章`);

                spinner = ora('开始抓取图片').start();

                return getImages(data, imgPath, imgRelatePath, jsonFileWithImagePath, options);
            })
            .then(data => {
                spinner.succeed(`抓取图片成功`);

                spinner = ora('开始生成Gitbook文档').start();
                return createBook(data, docPath, options);
            })
            .then(data => {
                spinner.succeed(`抓取成功，使用Gitbook看一下吧`);
                completeMessage(docPath);
                event.emit('stop');
            })
            .catch(e => {
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

if (!program.args[0]) {
    process.stdout.write(program.helpInformation());
    program.emit('--help');
}

function completeMessage(pwd) {
    /* eslint-disable*/
    console.log(
        chalk.green(`
    进入目录: ${chalk.yellow('cd ' + pwd)}
    查看结果: ${chalk.yellow('gitbook serve')}
`)
    );
    /* eslint-enable*/
}

function getMpSpiderConfigFile() {
    const p = path.resolve('./mpspider.config.js');
    if (fs.existsSync(p)) {
        try {
            return require(p);
        } catch (e) {
            return {};
        }
    }
    return {};
}
