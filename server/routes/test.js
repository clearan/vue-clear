const {resolve} = require('path')
const {readdirSync} = require('fs')
const path = resolve(__dirname,'../upload/e.png')
console.log(path)
;(async () => {
    const chunks = await readdirSync(path)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    console.log(chunks)
    Promise.all(
        chunks.map((item, index) => {
            return new Promise(resolve => {

            })
        })
    )
})()
// 测试node.js运行该文件，读取目录用
