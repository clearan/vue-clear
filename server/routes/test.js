const {resolve} = require('path')
const {readdirSync, promises} = require('fs')
const path = resolve(__dirname,'../upload/e.png')

// 测试node.js运行该文件，读取目录用
// ;(async () => {
//     const chunks = await readdirSync(path)
//     chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
//     console.log(chunks)
//     Promise.all(
//         chunks.map((item, index) => {
//             return new Promise(resolve => {
//
//             })
//         })
//     )
// })()

// 在内存中的Buffer
const buffer = Buffer.from('abc')
console.log('buffer', buffer)
// 读取文件状态信息
;(async () => {
    const stat = await promises.stat(resolve(__dirname, 'test.js'))
    console.log(stat)
})()
