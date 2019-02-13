const fs = require('fs-extra');
const {parseUrl} = require('./utils');
const path = require('path');
// const URL = require('url');

const BLOCK_MSG_HOST = 'js8.in';
const INJECT_FIle = path.join(__dirname, 'inject.js');

const BLOCK_HOST_NAME = 'mp.weixin.qq.com';
const BLOCK_PATH_NAME = '/mp/profile_ext';
const BLOCK_END_URL = 'http://js8.in';

module.exports = (event, cacheFilePath) => {
    let nickname = 'notitle';
    // 替换内容，插入inject.htmls
    function replaceHomeRes(serverResData) {
        serverResData = serverResData.toString();
        try {
            // 匹配文章内的列表
            let reg = /var msgList = \'(.*?)\';/;
            let ret = reg.exec(serverResData);
            ret = ret[1].replace(/&quot;/g, '"');
            if (!ret) {
                return null;
            }
            // 匹配nickname，公众号名称
            let match = /var nickname\s*=\s*(['"])(.+?)\1/;
            match = match.exec(serverResData);
            if (match.length) {
                nickname = match[2];
                event.emit('anyproxy_nickname', nickname);
            }
            savePosts(ret);

            return getInjectScript(serverResData);
        } catch (e) {
            console.log(e);
        }
        return '';
    }

    function getInjectScript(resData) {
        const script = fs.readFileSync(INJECT_FIle, {encoding: 'utf8'});
        return `${resData}
    <script>${script}</script>
    `;
    }
    // event.on('nickname', (data) => {
    //     name = 'notitle.txt';
    //     if (data.nickname) {
    //         name = data.nickname + '.txt';
    //     }
    //     // console.log(data);
    //     cacheFilePath = path.join(cacheFilePath, name);
    // });
    function savePosts(ret) {
        if (typeof ret === 'object') {
            ret = JSON.stringify(ret);
        }
        let filepath = path.join(cacheFilePath, `${nickname}.txt`);
        fs.writeFileSync(filepath, `${ret}\n`, {flag: 'a'});
    }

    return {
        *beforeSendRequest(req) {
            const url = parseUrl(req.url);
            // console.log(req.url);
            if (url.hostname === BLOCK_MSG_HOST && url.pathname && url.pathname.length > 1) {
                const evtName = url.pathname.slice(1);
                // 将消息透传出去
                event.emit(evtName, url.query);

                return {
                    response: {
                        statusCode: 200,
                        header: {'content-type': 'image/jpeg'},
                        body: ''
                    }
                };
            }
            return null;
        },
        *beforeDealHttpsRequest(req) {
            if (req._req.headers.host === BLOCK_HOST_NAME) {
                return true;
            }
            return false;
        },
        *beforeSendResponse(req, res) {
            const response = res.response;

            const url = parseUrl(req.url, true);
            if (url.hostname === BLOCK_HOST_NAME && url.pathname === BLOCK_PATH_NAME) {
                let serverResData = response.body;
                const {query} = url;
                switch (query.action) {
                    case 'home':
                        event.emit('anyproxy_home');

                        response.body = replaceHomeRes(serverResData);
                        break;
                    case 'getmsg':
                        try {
                            const json = JSON.parse(serverResData.toString());

                            if (json.general_msg_list) {
                                const ret =
                                    typeof json.general_msg_list === 'string'
                                        ? JSON.parse(json.general_msg_list)
                                        : json.general_msg_list;
                                savePosts(ret);
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        break;
                }
            }
            return new Promise((resolve, reject) => {
                resolve({response: response});
            });
        }
    };
};
