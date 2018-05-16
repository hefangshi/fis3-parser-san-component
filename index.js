/**
 * @file fis3 san component parser
 */

/* global fis */
var sanParser = require('san-loader/lib/parser');
var templateReWriter = require('./lib/template-rewriter');
var rewriteStyle = require('./lib/style-rewriter');

module.exports = function (content, file, conf) {
    var configs = Object.assign({
        sanRequirePath: 'san',
        cssScopedIdPrefix: 'scp-',
        cssScopedHashLength: 8
    }, conf || {});

    // 兼容content为buffer的情况
    content = content.toString();

    var result = sanParser(content, file.subpath);

    // check for scoped style nodes
    var hasScopedStyle = result.style.some(function (style) {
        return style.scoped
    });
    var scopeId = configs.cssScopedIdPrefix + fis.util.md5(file.subpath, configs.cssScopedHashLength);


    var output = 'var __san_script__, __san_template__\n' +
        'var san = require("' + configs.sanRequirePath + '")\n';
    // script
    if (result.script && result.script.length != 0) {
        output += fis.compile.partial(result.script[0].content, file, {
            ext: result.script[0].lang || 'js',
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
        var tpl = fis.compile.partial(result.template[0].content.trim(), file, {
            ext: result.template[0].lang || 'html',
            isHtmlLike: true
        });

        if (hasScopedStyle) {
            tpl = templateReWriter(tpl, scopeId);
        }

        output += '__san_script__.template=' + JSON.stringify(tpl) + '\n';
    }


    // css文件独立生成文件建立依赖关系
    result.style.forEach(function (item, index) {

        if(!item.content){
            return;
        }

        // empty string, or all space line
        if(/^\s*$/.test(item.content)){
            return;
        }

        // css也采用片段编译，更好的支持less、sass等其他语言
        var styleContent = fis.compile.partial(item.content.trim(), file, {
            ext: item.lang || 'css',
            isCssLike: true
        });

        if (item.scoped) {
            styleContent = rewriteStyle(scopeId, styleContent);
        }

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
