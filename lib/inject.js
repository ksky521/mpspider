(function() {
    var msgHost = 'http://js8.in/';
    var timer = setInterval(start, 2000);
    var curPage = 1;
    function json2Query(data) {
        if (!data) {
            data = {
                nickname: window.nickname ? nickname : 'notitle'
            };
        }
        var p = [];
        for (var i in data) {
            p.push(i + '=' + data[i]);
        }
        return p.join('&');
    }
    var j = json2Query({
        __biz: __biz,
        appmsg_token: appmsg_token,
        wxtoken: wxtoken,
        uin: uin,
        key: key,
        pass_ticket: encodeURIComponent(pass_ticket),
        f: 'json',
        count: 10,
        is_ok: is_ok,
        scene: scene
    });

    var next_offset = window.next_offset;
    var isFinished = false;
    function start() {
        Ajax({
            type: 'get',
            dataType: 'json',
            url: '/mp/profile_ext?action=getmsg&offset=' + next_offset + '&' + j,
            success: res => {
                sendMsg('progress', {curPage: curPage, count: res.msg_count});

                next_offset = res.next_offset;
                curPage++;
                if (res.msg_count < 5 || res.ret !== 0) {
                    clearInterval(timer);
                    sendMsg('end');
                    isFinished = true;
                }
            }
        });
    }
    function sendMsg(msg, json) {
        var img = new Image();
        img.src = msgHost + msg + '?_t=' + Date.now() + '&' + json2Query(json);
    }
    sendMsg('nickname', {
        nickname: nickname
    });
    function Ajax(obj) {
        var type = (obj.type || 'GET').toUpperCase();
        var async = typeof obj.async == 'undefined' ? true : obj.async;
        var url = obj.url;
        var xhr = new XMLHttpRequest();
        var timer = null;
        var data = null;

        if (typeof obj.data == 'object') {
            var d = obj.data;
            data = [];
            for (var k in d) {
                if (d.hasOwnProperty(k)) {
                    data.push(k + '=' + encodeURIComponent(d[k]));
                }
            }
            data = data.join('&');
        } else {
            data = typeof obj.data == 'string' ? obj.data : null;
        }

        xhr.open(type, url, async);
        var _onreadystatechange = xhr.onreadystatechange;

        xhr.onreadystatechange = function() {
            if (typeof _onreadystatechange == 'function') {
                _onreadystatechange.apply(xhr);
            }
            if (xhr.readyState == 3) {
                obj.received && obj.received(xhr);
            }
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = null;
                var status = xhr.status;
                if (status >= 200 && status < 400) {
                    var responseText = xhr.responseText;
                    var resp = responseText;
                    if (obj.dataType == 'json') {
                        try {
                            resp = eval('(' + resp + ')');
                        } catch (e) {
                            obj.error && obj.error(xhr);
                            return;
                        }
                    }
                    obj.success && obj.success(resp);
                } else {
                    obj.error && obj.error(xhr);
                }
                clearTimeout(timer);
                obj.complete && obj.complete();
                obj.complete = null;
            }
        };
        if (type == 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        }
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (typeof obj.timeout != 'undefined') {
            timer = setTimeout(function() {
                xhr.abort('timeout');
                obj.complete && obj.complete();
                obj.complete = null;
            }, obj.timeout);
        }
        try {
            xhr.send(data);
        } catch (e) {
            obj.error && obj.error();
        }
    }
    var isFirst = true;
    // 尝试添加页面展现和隐藏事件
    window.addEventListener('pageshow', function() {
        if (isFirst) {
            isFirst = false;
        } else {
            sendMsg('pageshow');
        }
    });

    window.addEventListener('pagehide', function() {
        if (!isFinished) {
            sendMsg('pagehide');
        }
    });
})();
