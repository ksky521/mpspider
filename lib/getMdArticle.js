const spider = require('@ksky521/spider');
const TurndownService = require('turndown');
const prettier = require('prettier');

const getMidFromUrl = require('./getMidFromUrl');

const turndown = new TurndownService({
    codeBlockStyle: 'fenced',
    fence: '```'
});

function getMdArticle(mid, url, options = {}) {
    if (options.turndown && typeof options.turndown === 'object') {
        const turndownOptions = options.turndown;
        // 设置 rulues
        const {rule: rules, keep, remove, plugins} = turndownOptions;
        if (rules) {
            Object.keys(rules).forEach(name => {
                const rule = rules[name];
                if (typeof name === 'string' && rule.filter && typeof rule.replacement === 'function') {
                    turndown.addRule(name, rule);
                } else {
                    throw new Error('config.turndown.rule is invalid!');
                }
            });
        }
        // keep
        if (keep) {
            turndown.keep(keep);
        }
        // remove
        if (remove) {
            turndown.remove(remove);
        }
        // use turndown plugins
        if (plugins) {
            turndown.use(plugins);
        }
    }
    const afterConverter = options.afterConverter;
    const after = afterConverter && typeof afterConverter === 'function' ? afterConverter : a => a;
    return new Promise((resolve, reject) => {
        if (!mid || !url) {
            return resolve();
        }
        spider.Spider(
            url,
            (err, data) => {
                if (!err) {
                    let content = data.content;
                    content = content.replace(/<img.+?data-src=(['"])(.+?)\1.+?>/g, (d, $1, $2) => {
                        if (~$2.indexOf('wx_fmt=')) {
                            $2 = $2.replace(/wx_fmt=(.+?)\b/, 'wx_fmt=webp');
                        } else {
                            if (~$2.indexOf('?')) {
                                $2 += '&wx_fmt=webp';
                            } else {
                                $2 += '?wx_fmt=webp';
                            }
                        }
                        return `<img src="${$2.replace('/0', '/640')}" />`;
                    });
                    // console.log(content);
                    // html 转 md
                    content = turndown.turndown(content, {gfm: true});
                    // prettier format处理下
                    content = prettier.format(content, {parser: 'markdown'});
                    data.content = after(content);
                    data.mid = mid;
                    resolve(data);
                } else {
                    resolve();
                }
                // content = toMd(content, { gfm: true });
                // console.log(title, content);
            },
            {
                links: {
                    selector: '#js_content a',
                    handler: (dom, $) => {
                        let url = dom.attr('href');
                        return {title: dom.text().trim(), mid: getMidFromUrl(url), url};
                    }
                },
                content: {
                    selector: '#js_content'
                },
                title: {
                    selector: 'title',
                    handler: (dom, $) => {
                        return dom.text();
                        // return dom;
                    }
                }
            }
        );
    });
}
module.exports = getMdArticle;
// getMdArticle(
//     'aaa',
//     'https://mp.weixin.qq.com/s?src=3&timestamp=1550123215&ver=1&signature=xqjBIqXRrTSrhO9bVfPMKw*Gg90a6ZTGaG2SA1uH4jPGkM9-vGr3Gw-ZC2Gr-IgA1HPzgU51xUeasEbairTF*0uiCzOUYK7sugkandpVvcW*2XesmtowD-KaEJKa6QwlVpxBnNY83a76pkJw3yaGFFXtXsJ5p2oMVogG64E3U1U=',
//     {
//         turndown: {
//             rule: {
//                 code1: {
//                     filter: ['span'],
//                     replacement: (content, node) => {
//                         console.log(node.getAttribute('style')==='font-size: 10px;');
//                         return content;
//                     }
//                 },
//                 code: {
//                     filter: ['tr'],
//                     replacement: content => {
//                         content = content.trim();
//                         if (/`$/.test(content) && /^1/.test(content)) {
//                             const rs = content.split(/\n/);
//                             const code = rs.splice(rs.length / 2 + 1);
//                             const realCode = [];
//                             for (let i = 0, len = rs.length; i < len; i++) {
//                                 if (rs[i].trim() && code[i]) {
//                                     realCode.push(code[i].replace(/`/g, ''));
//                                 }
//                             }
//                             content = `
// \`\`\`
// ${realCode.join('\n')}
// \`\`\`
// `;
//                         }
//                         return content;
//                     }
//                 }
//             }
//         }
//     }
// ).then(data => {
//     // console.log(data.content);
// });
