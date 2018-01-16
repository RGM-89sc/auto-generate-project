const fs = require('fs');
const child_process = require('child_process');

let projectPath;

/**
 * 判断目录路径的合法性
 *
 * @param {string} path 需要进行合法性判断的路径
 * @param {string} dirName 需要进行合法性判断的文件名
 * @return {string} 合法则返回目录的路径
 */
function dirPathJudgment(path, dirName) {
    if (!/^.+\/$/.test(path)) path += '/';
    let tmp = path + dirName + '/',
        regex = /^(?:[a-zA-Z]:)?\/(?:[^\\?\/*|<>:"]+\/)+$/;
    return regex.test(tmp) ? tmp : '';
}

/**
 * 判断文件名的合法性
 *
 * @param {string} fileName 需要进行合法性判断的文件名
 * @return {string} 合法则返回文件的路径
 */
function fileNameJudgment(fileName) {
    let regex = /^[^\\?\/*|<>:"]+\.[^.\\?\/*|<>:"]+$/;
    return regex.test(fileName) ? fileName : '';
}

/**
 * 判断文件路径和文件名的合法性
 *
 * @param {string} path 需要进行合法性判断的文件路径
 * @return {string} 合法则返回文件的路径
 */
function filePathJudgment(path) {
    let regex = /^"(?:[a-zA-Z]:)?\/(?:[^\\?\/*|<>:"]+\/)+[^\\?\/*|<>:"]+\.[^.\\?\/*|<>:"]+"$/;
    if (!/^".+"$/.test(path)) path = '"' + path + '"';
    return regex.test(path) ? path : '';
}

/**
 * 判断文件是否存在
 *
 * @param {string} path 需要进行判断存在性的文件路径
 * @return {boolean} 存在返回true，否则返回false
 */
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * 在dirName未定义的情况下自动获取文件夹名
 *
 * @param {string} path 目录路径
 * @return {string} 返回自动获取的文件夹名
 */
function getDirName(path) {
    let files = fs.readdirSync(path),
        re = /^Project([\d]+)$/,
        num = [];
    files.forEach((value) => {
        if (re.test(value)) num.push(parseInt(value.match(re)[1]));
    });
    if (num.length === 0) return 'Project1';
    let max = num[0];
    for (let i = 1; i < num.length; i++) {
        if (num[i] > max) max = num[i];
    }
    return 'Project' + (max + 1);
}

/**
 * 新建项目目录 & 生成目录初始文件
 *
 * @param {string} path 项目父目录路径
 * @param {string} dirName 项目目录名
 * @return {number} 返回-1表示发生错误，返回0表示执行成功
 */
function mkProjectDir(path, dirName) {
    if (!dirName) dirName = getDirName(path);
    projectPath = dirPathJudgment(path, dirName);
    if (projectPath === '') {
        console.log('路径格式错误');
        return -1;
    }
    try {
        fs.mkdirSync(projectPath, '0777');
    } catch (e) {
        if (fsExistsSync(projectPath)) console.log('路径已存在');
        else console.log('路径不存在');
        return -1;
    }
    console.log('目录' + dirName + '已生成');
    let context = '<!DOCTYPE html>\n<html lang="cmn">\n<head>\n    <meta charset="UTF-8">\n    ' +
        '<title>Title</title>\n    <link rel="stylesheet" href="css/style.css" type="text/css">\n' +
        '<body>\n    \n</body>\n</html>';
    fs.writeFile(projectPath + '/index.html', context, 'utf-8', (err) => {
        if (err) throw err;
        else {
            console.log('文件index.html已生成');
            return 0;
        }
    });
}

/**
 * 新建项目分支目录 & 生成目录初始文件
 *
 * @param {string} dirName 项目分支目录名
 * @param {boolean} genFile 是否生成相应的目录初始文件
 * @param {string} fileName 初始文件名，仅当genFile为true时有效
 * @return {number} 返回-1表示发生错误，返回0表示执行成功，返回1表示提前结束函数
 */
function mkForkDir(dirName, genFile, fileName) {
    if (projectPath) {
        let path = dirPathJudgment(projectPath, dirName);
        if (path === '') {
            console.log('路径格式错误');
            return -1;
        }
        try {
            fs.mkdirSync(path, '0777');
        } catch (e) {
            if (fsExistsSync(projectPath)) console.log('路径已存在');
            else console.log('路径不存在');
            return -1;
        }
        console.log('目录' + dirName + '已生成');
        if (genFile) {
            let extension,
                context = '',
                regexCSS = /^css$/i,
                regexJS = /^js$/i;
            if (regexCSS.test(dirName)) {
                extension = 'css';
            } else if (regexJS.test(dirName)) {
                extension = 'js';
                context = '(function(){\n' + '    \n' + '})();';
            } else {
                console.log('目录' + dirName + '不生成初始文件');
                return 1;
            }
            let file = fileNameJudgment(fileName + '.' + extension);
            fs.writeFile(path + file, context, 'utf-8', (err) => {
                if (err) throw err;
                else {
                    console.log('文件' + fileName + '.' + extension + '已生成');
                    return 0;
                }
            });
        }
    } else {
        console.log('项目路径不存在');
        return -1;
    }
}

/**
 * 打开编辑器
 *
 * @param {string} editorName 编辑器名称
 * @param {string} path 编辑器路径
 * @return {number} 返回-1表示发生错误，返回0表示执行成功
 */
exports.openEditor = (editorName, path) => {
    console.log('正在打开编辑器' + editorName);
    try {
        child_process.execSync(filePathJudgment(path));
    } catch (e) {
        console.log('文件路径不正确');
        return -1;
    }
    return 0;
};

/**
 * 执行
 *
 * @param {string} path 项目父目录路径
 * @param {string} dirName 项目目录名
 * @return {number} 返回-1表示发送错误，返回0表示执行成功
 */
function tasks(path, dirName) {
    function success(val) {
        for (let i = 0; i < val.length; i++) {
            if (val[i] === -1) {
                return false;
            }
        }
        return true;
    }

    if (!arguments[2]) arguments[2] = true;
    if (!arguments[3]) arguments[3] = 'style';
    if (!arguments[4]) arguments[4] = 'main';
    let taskList = [
        mkProjectDir(path, dirName),
        mkForkDir('css', arguments[2], arguments[3]),
        mkForkDir('js', arguments[2], arguments[4]),
        mkForkDir('img')
    ];
    return success(taskList) ? 0 : -1;
}

/**
 * 默认方式生成项目
 *
 * @param {string} path 项目父目录路径
 * @param {string} dirName 项目目录名
 */
exports.defaultGenerateProject = (path, dirName) => {
    if (tasks(path, dirName) === 0) console.log('项目生成完毕');
    else console.log('项目生成失败');
};

/**
 * 默认方式生成项目并打开编辑器
 *
 * @param {string} path 项目父目录路径
 * @param {string} dirName 项目目录名
 * @param {string} editorName 编辑器名称
 * @param {string} editorPath 编辑器路径
 */
exports.defaultGenerateProjectOpenEditor = (path, dirName, editorName, editorPath) => {
    if (tasks(path, dirName) === 0) console.log('项目生成完毕');
    else console.log('项目生成失败');
    exports.openEditor(editorName, editorPath);
};

/**
 * 生成项目
 *
 * @param {string} path 项目父目录路径
 * @param {string} dirName 项目目录名
 * @param {boolean} genFile 是否生成初始文件
 * @param {string} CSSFileName CSS初始文件名，仅当genFile为true时有效
 * @param {string} JSFileName JS初始文件名，仅当genFile为true时有效
 */
exports.GenerateProject = (path, dirName, genFile, CSSFileName, JSFileName) => {
    if (tasks(path, dirName, genFile, CSSFileName, JSFileName) === 0)
        console.log('项目生成完毕');
    else console.log('项目生成失败');
};
