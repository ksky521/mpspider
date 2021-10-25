# 公众号文章抓取&生成 kindle 电子书

抓取公众号历史文章，解析成 markdown 文件，生成 gitbook 项目，最后可生成 kindle 书籍。

**PS**：

1. 需要 ebook-convert 依赖
2. gitbook 需要在 node 6.x 版本，8.x 不能用，其他没测试
3. 生成 mobi 需要配置下`book.json`

## 抓取方式

支持两种抓取方式：

1. 从公众号的一篇汇总文章开始，有些公众号会有年度总结文章，比如 [这篇文章](https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag)
2. 使用 anyproxy 做代理，抓取公众号历史消息文章，忽略非图文类、小标题类文章

**PS**：汇总文章指的是一个公众号的文章页面，比如「架构师之路」的 [这篇文章](https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag)

## 流程介绍

1. 抓取文章
2. 解析文章内链的外链「公众号文章」
3. 继续抓取外链文章
4. 替换外链文章到本地相对地址
5. 抓取文章内的图片
6. 替换文章图片到本地相对地址
7. 生成 gitbook 项目
8. 使用 gitbook+ebook-convert 生成 kindle 文件

1~6 步是全自动的，7 是看自己情况

## 安装

```bash
npm i mpspider -g
```

### 执行方式

```bash
# 第一种方式
mpspider article https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag -d dest_path
# 第二种方式，需要手动配置代理，点击公众号「查看历史文章」，详见下面介绍，支持手机微信和 pc 微信列表
mpspider proxy -d dest_path -p proxy_port
```

抓取后，会在`dest_path`创建 gitbook 项目

### 生成电子书

执行命令

```bash
# 进入抓取后gitbook的地址
cd dest_path
# 创建readme.md，gitbook不创建会报错
touch README.md
# 有必要可以创建book.json，参考gitbook文档
gitbook serve
# 访问地址查看效果
# -------
# 生成电子书
gitbook mobi ./ name.mobi

```

## 如何配置 anyproxy 代理抓取 https 页面

### 配置 anyproxy https 证书

参考：http://anyproxy.io/cn/#%E8%AF%81%E4%B9%A6%E9%85%8D%E7%BD%AE

### 启动 anyproxy

```bash
anyproxy --rule lib/anyproxyRule.js
```

## 使用配置文件`mpspider.config.js`

支持配置项：

-   book.json 配置项：'author', 'title', 'description'
-   summarySort：文章排序函数，方法等同 `Array.sort`写法，传入`item`对象，有`mid`、`title`、`content`、`release`、`uri`等选项，release 是拼音文件名，**默认根据 release 排序**
-   `filter`：文章内容过滤函数，将文章列表数组`items`通过 `items.filter(option.filter)` 过滤一遍，item 内容包括：`mid`、`title`、`content`
-   `listFilter`：列表文章过滤，只用在 proxy 模式下，根据文章列表的 json 对象过滤数据，常用对象字段为
    -   app_msg_ext_info：`author`、`title`、`copyright_stat`、`content_url`、`source_url`、`digest`、`content`、`cover`、`is_multi`等
    -   comm_msg_info：`datetime`发布时间戳
-   `turndown`：支持`keep`、`remove`、`rule`、`plugins` 四个选项，分别对应 turndown 的四个配置项
-   `afterConverter`：turndown 将 html 转为 markdown 内容之后，将`content`字符串传入该函数，处理结束后，`return`处理后的字符串

示例：

```js
const turndownPluginGfm = require('turndown-plugin-gfm');
module.exports = {
    filter: item => {
        if (item.title.indexOf('广告') !== -1) {
            return false;
        }
        return true;
    },
    turndown: {
        keep: 'span',
        remove: 'span',
        rule: {
            strikethrough: {
                filter: ['del', 's', 'strike'],
                replacement: function(content) {
                    return '~' + content + '~';
                }
            }
        },
        plugins: [turndownPluginGfm.gfm, turndownPluginGfm.tables]
    },
    afterConverter: content => {
        return content.replace(/<(.+?)>/g, (i, m) => {
            return `&lt;${m}>`;
        });
    }
};
```

## 二次开发

git clone 源码后，进入文件夹，执行`npm i`

-   index.js 入口文件，使用`commander`和`ora`进行命令处理
-   getList.js 根据汇总文件提取文章列表
-   proxySpider.js 根据 anyproxy 代理方式抓取
-   dealMPList.js 根据代理抓取使用的文件
-   unfetchMids.js 提取文章列表中内链的文章
-   getImages.js 抓取文章中的图片地址，并且替换为本地地址
-   createBook.js 生成 gitbook markdown 文件和`summary.md`，替换内链的文内容

## 电子书依赖

-   ebook-convert：`brew install caskroom/cask/calibre`
-   gitbook：`npm i gitbook-cli -g`

## kindle 效果截图

![目录列表](./screen_capture/1.jpeg)

![带图文章](./screen_capture/2.jpeg)

![普通文章](./screen_capture/3.jpeg)

## 给作者加鸡腿

![加鸡腿](./wechat.jpeg)
