const fs = require('fs-extra');
const path = require('path');
module.exports = (data, filepath) => {
    if (!filepath) {
        filepath = process.cwd();
    }
    filepath = path.join(filepath, title, '.md');
    fs.writeFileSync(filepath, data);
    return {
        name: title,
        filepath
    };
};
