const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const getImg = (module.exports = (url, filepath) => {
    const md5 = crypto.createHash('md5');

    let result = md5.update(url).digest('hex');
    let name = `${result}.png`;
    filepath = path.join(filepath, name);
    let count = 0;
    return new Promise((resolve, reject) => {
        get();

        function get() {
            request
                .get(url)
                .on('end', (e) => {
                    resolve({
                        url,
                        filepath,
                        name
                    });
                })
                .on('error', (e) => {
                    count++;
                    if (count === 2) {
                        return resolve();
                    }
                    get();
                    // console.log(url);
                })
                .pipe(fs.createWriteStream(filepath));
        }
    });
});

// getImg(
//     'https://mmbiz.qpic.cn/mmbiz_png/YrezxckhYOxsH4QG9XwyWxE8PIogeSocd7oRicBIDN3TbM83nPngicWel4bgIMOOzzATPKzVrgOo1EkuZF8up2icQ/640?wx_fmt=webp',
//     './'
// );
