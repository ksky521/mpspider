## 公众号文章抓取生成mobi

自己写的从公众号汇总文章开始，抓取公众号好文章，生成kindle可用的文件，项目借github存储下。

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

### 使用方法

```
mkdir -p docs/imgs

node index.js
node unfetchMids.js
node unfetchMids.js

node unfetchMids.js
...

node getImages.js
node createBooks.js

cd docs
touch README.md
touch book.json
gitbook serve

gitbook mobi ./ shenjian.mobi
```