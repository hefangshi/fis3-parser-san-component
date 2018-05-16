# fis3-parser-san-component


## 安装

```
npm install fis3-parser-san-component --save-dev
```

## 基础配置

```javascript
fis.match('src/**.san', {
    isMod: true,
    rExt: 'js',
    useSameNameRequire: true,
    parser: fis.plugin('san-component', {

        // 插件内部会自动注入对 san 的 require 的代码， 默认是 'san'
        // 对于不使用 npm 来管理依赖的 app，可能有必要手动配置路径
        sanRequirePath: 'san',

        // css scoped
        cssScopedIdPrefix: 'scp-', // hash前缀
        cssScopedHashLength: 8 // hash 长度
    })
});
```

## 异构语言支持

- script： ES6、ts、coffee ...
- template: jade ...
- style: less, sass ...

在对应的标签 `template`,`script`,`style` 上添加 `lang` 属性， 然后在 `fis-conf.js` 里配置：

```javascript
// 以 less 为例
fis.match('src/**.vue:less', {
    rExt: 'css',
    parser: fis.plugin('less'),
    postprocessor: fis.plugin('autoprefixer')
})
```

其他用法参考[fis3-parser-vue-component](https://github.com/ccqgithub/fis3-parser-vue-component)
