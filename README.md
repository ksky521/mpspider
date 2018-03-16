## 公众号文章抓取生成mobi

自己写的从「公众号汇总文章」开始，抓取公众号好文章，生成kindle可用的文件，项目借github存储下。

1. 配置index.js选择一篇汇总性文章，使用node抓取公众号文章
2. 抓取相关外链的文章
3. 重复2，直到没有
4. 抓取文章配图
5. 生成gitbook项目
6. 通过gitbook生成mobi

**PS**：
1. 需要ebook-convert依赖
2. gitbook需要在node 6.x版本，8.x不能用，其他没测试
3. 生成mobi需要配置下`book.json`


使用「架构师之路」公众号文章做demo

**PS**：汇总文章指的是一个公众号的文章页面，比如「架构师之路」的 [这篇文章](https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag)

## 如何运行

```
node index.js mp_url -p doc_path

cd doc_path
touch README.md
touch book.json
gitbook serve

gitbook mobi ./ shenjian.mobi
```

## 二次开发

git clone源码后，进入文件夹，执行`npm i`

* index.js 入口文件，使用`commander`和`ora`进行命令处理
* getList.js 根据汇总文件提取文章列表
* unfetchMids.js 提取文章列表中内链的文章
* getImages.js 抓取文章中的图片地址，并且替换为本地地址
* createBook.js 生成gitbook markdown文件和`summary.md`，替换内链的文内容

## 依赖

* ebook-convert：`brew install caskroom/cask/calibre`
* gitbook：`npm i gitbook-cli -g`

