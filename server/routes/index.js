const router = require('koa-router')()
const users = require('../data/user');
const routers = require('../data/router');
const {resolve} = require('path')
const {readFileSync, createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, rmdirSync, statSync} = require('fs')
const mime = require('mime-types')
const send = require('koa-send');

router.post('/user_router_auth', async (ctx, next) => {
  const {uid} = ctx.request.body
  if (uid) {
    let authRouterInfo = [];
    const userInfo = users.filter(user => String(user.id) === String(uid))[0];
    userInfo.auth.map((rid) => {
      routers.map((router) => {
        if (router.id === rid) {
          authRouterInfo.push(router)
        }
      })
    })
    ctx.body = authRouterInfo;
    next()
  } else {
    next();
  }
})

router.get('/images/:filename', (ctx, next) => {
  console.log('-----------------')
  const url = ctx.request.url;
  const filePath = resolve(__dirname, '..' + url)
  const file = readFileSync(filePath);
  const mimeType = mime.lookup(filePath); //读取图片文件类型
  ctx.set('content-type', mimeType); //设置返回类型
  ctx.body = file
  next()
})

router.post('/uploadFile', async (ctx, next) => {
  const {chunk} = ctx.request.files;
  const {hash, filename} = ctx.request.body;
  // 建立我们要指定存放的的文件目录
  if (!existsSync(resolve(__dirname,'../upload/'))) {
    await mkdirSync(resolve(__dirname,'../upload/'))
  }
  // 上传文件的临时路径，读取它
  const reader = createReadStream(chunk.path);
  reader.on('end', () => {
    // 读完删除该分片
    unlinkSync(chunk.path)
  })
  const chunkDir = resolve(__dirname,'../upload/' + filename)
  const filepath = resolve(__dirname,'../upload/' + filename + '/' + hash)
  if (!existsSync(chunkDir)) {
    await mkdirSync(chunkDir) // 建立我们要指定存放的的文件目录
  }
  const upstream = createWriteStream(filepath) // 创建可写流
  reader.pipe(upstream)
  ctx.body = {msg: '上传成功'}
})

router.post('/merge', async (ctx, next) => {
  const {name, hash, size} = ctx.request.body
  const path = resolve(__dirname,'../upload/' + hash)
  const targetPath = resolve(__dirname,'../upload/target')
  if (!existsSync(targetPath)) {
    await mkdirSync(targetPath) // 建立我们要指定存放的的文件目录
  }
  const newPath = resolve(__dirname,'../upload/target/' + name)
  // 读取刚刚上传的文件所在目录
  const chunks = await readdirSync(path)
  // 按照指定的索引值排序，便于按照顺序合并
  chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
  await Promise.all(
      chunks.map((item, index) => {
        const filepath = resolve(__dirname,'../upload/' + hash + '/' + item)
        return new Promise(resolve => {
          const reader = createReadStream(filepath)
          reader.on('end', () => {
            // 读完删除该分片
            unlinkSync(filepath)
            resolve()
          })
          const writer = createWriteStream(newPath, {
            start: size * index,
            end: (index+1) * size
          })
          reader.pipe(writer)
        })
      })
  )
  // 合并完毕后删除之前的分片目录
  console.log('path', path)
  await rmdirSync(path)
  ctx.body = {msg: '上传完毕'}
})

router.post('/verifyUpload', async (ctx, next) => {
  const {filename, hash} = ctx.request.body
  const ext = filename.slice(filename.lastIndexOf('.'))
  const path = resolve(__dirname, '../upload/target/' + hash + ext)
  if (existsSync(path)) {
    ctx.body = {msg: '秒传成功！', isExist: true}
  } else {
    ctx.body = {msg: '秒传失败！', isExist: false, uploadList: await getUploadedList(hash)}
  }
})

const  getUploadedList = async hash => {
  const path = resolve(__dirname, '../upload/' + hash)
  return existsSync(path)
      ? await readdirSync(path)
      : []
}

function delay(time) {
  return new Promise((resolve,reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}
router.post('/getDateList', async (ctx, next) => {
  // setTimeout(() => {
  //   ctx.body =  readFileSync(resolve(__dirname, '../data/images.json'), 'utf8')
  // }, 1000) 这种写法错误
  await delay(2000)
  ctx.body =  readFileSync(resolve(__dirname, '../data/images.json'), 'utf8')

})

router.post('/canvasUpload', async ctx => {
  console.log(ctx.request.files)
  const file = ctx.request.files.imageFile
  const {filename} = ctx.request.body
  if (!existsSync(resolve(__dirname,'../upload/'))) {
    await mkdirSync(resolve(__dirname,'../upload/'))
  }
  const targetPath = resolve(__dirname, '../upload/canvasImage')
  const targetFile = resolve(__dirname, '../upload/canvasImage/' + filename)
  if (!existsSync(targetPath)) {
    await mkdirSync(targetPath)
  }
  const reader = createReadStream(file.path)
  reader.on('end', () => {
    // 读完删除该分片
    unlinkSync(file.path)
  })
  const writer = createWriteStream(targetFile)
  reader.pipe(writer)
  ctx.body = {msg: '上传成功'}
})

router.get('/download/:filename', async ctx => {
  // const {filename} = ctx.request.body
  // const filepath = resolve(__dirname, '../upload/target/' + filename)
  // const reader = createReadStream(filepath)
  // ctx.set('Content-disposition', 'attachment; filename=' + filename + '.pdf');
  // ctx.set('Content-type', 'video/mp4');
  const filename = ctx.params.filename;
  const filepath = 'upload/target/'+filename
  ctx.attachment(filepath)
  await send(ctx, filepath)
})

router.post('/getFileLength', ctx => {
  const {filename} = ctx.request.body;
  const filepath = resolve(__dirname, '../upload/target/' + filename)
  const {size} = statSync(filepath)
  ctx.body = {fileSize: size}

})
// 分片下载： 前端首先一个HEAD请求过来，获取文件的size
// 后端的get请求可以截获HEAD请求，然后返回文件size
// 前端再做range请求处理。
router.get('/sliceDownload', ctx => {
  const {filename} = ctx.query;
  const filepath = resolve(__dirname, '../upload/target/' + filename)
  const {size} = statSync(filepath)
  const {range} =ctx.headers;
  // 下面的注释按照标准来的话应该要带上的，不带文件也可以正常返回
  if (!range) {
    // ctx.set('Accept-Ranges', 'bytes')
    // ctx.set('Content-Disposition', 'attachment; filename=' + encodeURIComponent(filename),)
    // ctx.set('content-type', 'application/oct-stream')
    // ctx.set("Access-Control-Expose-Headers", 'Content-Disposition')
    ctx.set('Content-Length', size)
    ctx.body = createReadStream(filepath) // HEAD请求没有响应体，但是ctx.body还是要赋值文件流，不然404，浏览器会忽略掉响应体的内容
  } else {
    // ctx.response.status = 206;
    // ctx.set('Accept-Ranges', 'bytes')
    const start = Number(range.split('-')[0].split('=')[1])
    const end = Number(range.split('-')[1])
    // ctx.set('Content-Range', `bytes ${start}-${end}/${size} `)
    ctx.body = createReadStream(filepath, {start, end})
  }
})

router.post('/test', async (ctx, next) => {
  await delay(200)
  ctx.body = 'ok'
})
module.exports = router
