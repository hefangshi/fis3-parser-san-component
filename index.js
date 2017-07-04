/**
 * @file fis3 san component parser
 */

/* global fis */

var sanParser = require('san-loader/lib/parser');

module.exports = function (content, file) {
    var result = sanParser(content, file.subpath);
    var output = 'var __san_script__, __san_template__\n' +
        'var san = require("san")\n';
    // script
    if (result.script && result.script.length != 0) {
        output += fis.compile.partial(result.script[0].content, file, {
            ext: 'js',
            isJsLike: true
        }) + '\n';
        output += 'if(exports && exports.__esModule && exports.default){\n';
        output += '  __san_script__ = exports.default;\n';
        output += '}else{\n';
        output += '  __san_script__ = module.exports;\n';
        output += '}\n';
    } else {
        output += '__san_script__= {};\n';
    }
    // template属性注入组件
    if (result.template && result.template.length != 0) {
        output += '__san_script__.template=' + JSON.stringify(fis.compile.partial(result.template[0].content, file, {
            ext: 'html',
            isHtmlLike: true
        })) + '\n';
    }
    // css文件独立生成文件建立依赖关系
    result.style.forEach(function (item, index) {
        var styleContent = item.content;
        var styleFileName, styleFile;
        if (result.style.length == 1) {
            styleFileName = file.realpathNoExt + '.css';
        } else {
            styleFileName = file.realpathNoExt + '-' + index + '.css';
        }

        styleFile = fis.file.wrap(styleFileName);
        styleFile.cache = file.cache;
        styleFile.isCssLike = true;
        styleFile.setContent(styleContent);
        fis.compile.process(styleFile);
        styleFile.links.forEach(function (derived) {
            file.addLink(derived);
        });
        file.derived.push(styleFile);
        file.addRequire(styleFile.getId());
    });
    output +=
        'var __san_proto__ = {}\n' +
        'if (__san_script__) {\n' +
        '  __san_proto__ = __san_script__.__esModule\n' +
        '    ? __san_script__[\'default\']\n' +
        '    : __san_script__\n' +
        '}\n' +
        'if (__san_template__) {\n' +
        '  __san_proto__.template = __san_template__\n' +
        '}\n' +
        'var __san_exports__ = san.defineComponent(__san_proto__)\n' +
        'module.exports = __san_exports__\n';
    return output;
}