<template>
<div class="wrap">
  <button class="upload-btn" @click="handleBtn">点击上传</button>
  <input type="file" ref="input" class="input" @change="handleChange">
  <button style="margin-left: 20px" @click="pauseUpload">暂停上传</button>
  <button style="margin-left: 20px" @click="resumeUpload">恢复上传</button>
  <button style="margin-left: 20px" @click="fileDownload">直接下载</button>
  <button style="margin-left: 20px" @click="fileSliceDownload">分片下载</button>
  <iframe name="myIframe" style="display:none"></iframe>
  <div class="progress">
    <p>
      <span>文件读取进度</span>
    </p>
    <div>
      <span class="out-box">
        <span class="out-water" :style="styleHash"></span>
      </span>
      <span>{{ hashPercentage }}%</span>
    </div>
  </div>
  <div class="progress">
    <p>
      <span>总进度</span>
      <span style="margin-left: 20px;font-size: 14px">大小: {{allSize}}</span>
    </p>
    <div>
      <span class="out-box">
        <span class="out-water" :style="allPer"></span>
      </span>
      <span>{{ allPercent }}%</span>
    </div>
  </div>
  <div class="list">
    <div class="header">
      <span class="a1">切片</span>
      <span class="a2">大小(KB)</span>
      <span class="a3">进度</span>
    </div>
    <div class="content" v-for="(item,index) in datas" :key="index">
      <span class="a1">{{ item.hash }}</span>
      <span class="a2">{{ item.size }}</span>
      <span class="a3">
        <span class="box">
          <span class="water" :style="style(item.percentage)"></span>
        </span>
        <span>{{ item.percentage }}%</span>
      </span>
    </div>
<!--    <div class="content">-->
<!--      <span class="a1">dsadsd</span>-->
<!--      <span class="a2">33</span>-->
<!--      <span class="a3">-->
<!--        <span class="box">-->
<!--          <span class="water"></span>-->
<!--        </span>-->
<!--        <span>0%</span>-->
<!--      </span>-->
<!--    </div>-->
  </div>
</div>
</template>

<script>
import axios from "axios";
import {mergeRequest, verifyUpload, getFileLength} from "../services";

const SIZE = 20 * 1024 * 1024 // 10M
const RANGE = 10 * 1024 * 1024

export default {
  name: "Upload",
  data() {
    return {
      file: null,
      datas: [],
      hashPercentage: 0,
      // 文件哈希
      fileHash: '',
      // 所有并发的http请求
      requestList: null,
      requestDatas: null,
    }
  },
  computed: {
    filename() {
      const filename = this.file.name
      const ext = filename.slice(filename.lastIndexOf('.'))
      return this.fileHash + ext
    },
    style() {
      return val => {
        return {transform: `translateX(-${100 - val}%)`}
      }
    },
    allPer() {
      if(!this.file) return 0
      const val = this.handleAllPer()
      return {transform: `translateX(-${100 - val}%)`}
    },
    allPercent() {
      if(!this.file) return 0
      return this.handleAllPer()
    },
    // 文件总大小
    allSize() {
      if(!this.file) return 0
      return this.bytesToSize(this.file.size)
    },
    styleHash() {
      return  {transform: `translateX(-${100 - this.hashPercentage}%)`}
    }
  },
  methods: {
    bytesToSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toPrecision(3)}  ${sizes[i]}`;
    },
    handleAllPer() {
      const loaded = this.datas.map(item => item.percentage * item.size).reduce((acc, cur) => acc + cur, 0)
      return parseInt(String((loaded / this.file.size)));
    },
    handleBtn() {
      this.$refs.input.click();
      // document.querySelector('.input').click()
    },
    async handleChange(e) {
      this.file = e.target.files[0];
      console.log('file', this.file);
      const fileChunk = [];
      let cur = 0;
      while(cur < this.file.size) {
        fileChunk.push({
          myFile: this.file.slice(cur, cur + SIZE)
        })
        cur += SIZE;
      }
      console.log('fileChunk', fileChunk)
      // 根据文件内容计算文件的hash值
      this.fileHash = await this.createFileHash({fileChunk})
      console.log(this.fileHash)
      const {isExist, uploadList} = await verifyUpload({
        filename: this.file.name,
        hash: this.fileHash
      })
      if (isExist) {
        alert('上传成功')
        return
      }
      this.datas = fileChunk.map(({myFile},index) => ({
        fileHash: this.fileHash,
        chunk: myFile,
        // hash: this.file.name + '-' + index,
        hash: this.fileHash + '-' + index,
        size: myFile.size,
        percentage: 0
      }))
      await this.uploadChunk(uploadList)
    },
    async uploadChunk(uploadedList =[]) {
      const unUploads = this.datas.filter(({hash}) => !uploadedList.includes(hash));
      this.requestList =  unUploads.map((item, index) => {
        const formData = new FormData();
        formData.append('chunk', item.chunk)
        formData.append('hash', item.hash)
        formData.append('filename', this.fileHash)
        return {formData, index};
      }).map(({formData, index}) => {
        // return () => {
        return this.uploadFile({
          data: formData,
          onProgress: e => {
            this.datas[index].percentage = parseInt(String((e.loaded / e.total) * 100));
          },
          index,
        })
        // }
      })
      console.log(this.requestList)
      const res = await Promise.all(this.requestList)
      console.log('unUploads', unUploads)
      console.log('uploadedList', uploadedList.length)
      console.log('this.datas', this.datas.length)
      if ( uploadedList.length + unUploads.length === this.datas.length) {
        await this.mergeRequest()
      }
    },
    async mergeRequest() {
      await mergeRequest({name: this.filename, hash:this.fileHash,  size: SIZE});
    },
    createFileHash({fileChunk}) {
      return new Promise(resolve => {
        const worker = new Worker('hash.js')
        worker.postMessage({fileChunk})
        worker.onmessage = e => {
          const { percentage, hash } = e.data;
          this.hashPercentage = percentage;
          if (hash) {
            resolve(hash)
          }
        }
      })
    },
    pauseUpload() {
      console.log('pauseUpload', this.requestList)
      this.requestList.forEach(item => {
        item.cancel()
      })
    },
    async resumeUpload() {
      const {uploadList} = await verifyUpload({
        filename: this.file.name,
        hash: this.fileHash
      })
      await this.uploadChunk(uploadList)
    },
    uploadFile(data) {
      const CancelToken = axios.CancelToken;
      let cancel;
      const promise =  axios({
        url: 'http://localhost:3000/uploadFile',
        data: data.data,
        method: 'post',
        onUploadProgress: data.onProgress,
        cancelToken: new CancelToken(c => {
          cancel = c;
        })
      }).then(res => {
        console.log(data.index+'请求完毕')
        const delIndex = this.requestList.findIndex(item => item === promise)
        this.requestList.splice(delIndex, 1)
        return data.index
      })
      // cancel('终止请求')
      promise.cancel = cancel
      // return {promise, cancel, index: data.index}
      return promise
    },
    fileDownload() {
      window.open('http://localhost:3000/download/'+this.filename,'myIframe')
    },
    async fileSliceDownload() {
      // const {fileSize} = await getFileLength({filename: this.filename})
      const {headers} = await axios({
        url: 'http://localhost:3000/sliceDownload',
        params: {filename: this.filename},
        method: 'head',
      })
      const fileSize = headers['content-length']
      // const blob = new Blob([r.data])
      // console.log(blob)
      // const href = URL.createObjectURL(blob);
      // console.log(href)
      // this.downloadTarget(href, this.filename);
      // URL.revokeObjectURL(href);

      const list = this.getStartEnd(fileSize, RANGE)
      console.log(list)
      const requests = list.map(item => {
        return () => {
          return new Promise(resolve => {
            axios({
              url: 'http://localhost:3000/sliceDownload',
              params: {filename: this.filename},
              method: 'get',
              headers: {
                'Range': `bytes=${item.start} - ${item.end}`
              },
              responseType: 'arraybuffer' //
            }).then(res => {
              resolve(res)
            })
          })
        }
      })
      await this.handleRuleRequest(requests, 3)
    },
    async handleRuleRequest(arr, length) {
      const result = []
      const requestList = Array.from({length}).map(item => {
        return new Promise(resolve => {
          function deep() {
            if (arr.length <= 0) {
              resolve('完毕')
              return
            }
            const target = arr.shift()
            target().then((res) => {
              result.push(res.data)
              deep()
            })
          }
          deep()
        })
      })
      const isFinish = await Promise.all(requestList)
      console.log(result)
      const allBuffer  = this.concatBuffer(result.map(item => new Uint8Array(item)))
      const blob = new Blob([allBuffer])
      console.log(blob)
      const href = URL.createObjectURL(blob);
      this.downloadTarget(href, this.filename);
      // 释放一个之前已经存在的、通过调用 URL.createObjectURL() 创建的 URL 对象
      URL.revokeObjectURL(href);
    },
    concatBuffer(list) {
      let totalLength = 0;
      for (let item of list) {
        totalLength += item.length;
      }
      // 实际上Uint8Array目前只能支持9位，也就是合并最大953M(999999999字节)的文件
      let result = new Uint8Array(totalLength);
      console.log('totalLength', totalLength)
      let offset = 0;
      for (let item of list) {
        result.set(item, offset);
        offset += item.length;
      }
      console.log('result', result)
      return result.buffer;
    },
    getStartEnd(length, range) {
      const list = []
      let start = 0,end;
      while(start < length) {
        const tmp = start + range + 1
        end = tmp > length ? length - 1 : tmp
        list.push({start, end})
        start = end + 1;
      }
      return list
    },
    downloadTarget(url, fileName = '未知文件') {
      const el = document.createElement('a');
      el.style.display = 'none';
      el.setAttribute('target', '_blank');
      /**
       * download的属性是HTML5新增的属性
       * href属性的地址必须是非跨域的地址，如果引用的是第三方的网站或者说是前后端分离的项目(调用后台的接口)，这时download就会不起作用。
       * 此时，如果是下载浏览器无法解析的文件，例如.exe,.xlsx..那么浏览器会自动下载，但是如果使用浏览器可以解析的文件，比如.txt,.png,.pdf....浏览器就会采取预览模式
       * 所以，对于.txt,.png,.pdf等的预览功能我们就可以直接不设置download属性(前提是后端响应头的Content-Type: application/octet-stream，如果为application/pdf浏览器则会判断文件为 pdf ，自动执行预览的策略)
       */
      fileName && el.setAttribute('download', fileName);
      el.href = url;
      console.log(el);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    }
  },
  // mounted() {
  //   const worker = new Worker('hash.js')
  //   console.log(worker)
  //   worker.postMessage({data: 1000})
  //   worker.onmessage = e => {
  //     console.log('主线程接收', e.data)
  //   }
  //   console.log('执行')
  // }
}
</script>

<style scoped lang="scss">
.wrap {
  input {
    display: none;
  }
  .progress {
    width: 630px;
    .out-box {
      position: relative;
      display: inline-block;
      width: 560px;
      height: 6px;
      margin-right: 10px;
      border: 1px solid;
      border-radius: 5px;
      overflow: hidden;
      .out-water {
        position: absolute;
        left: 0;
        height: 100%;
        width: 100%;
        background: #409eff;
        border-radius: 2px;
        transform: translateX(-100%);
        transition: all 0.4s;
      }
    }
  }
.list {
  margin-top: 30px;
  .header, {
    border-top: 1px solid;
    font-weight: 600;
  }
  .content {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    font-size: 12px;
    height: 30px;
    border-top: 1px solid;
    border-bottom: 1px solid;
  }
  .header span {
    display: inline-block;
    text-align: center;
    font-size: 12px;
  }
  .a1 {
    width: 200px;
    text-align: center;
  }
  .a2 {
    width: 100px;
    text-align: center;
  }
  .a3 {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 300px;
    .box {
      position: relative;
      width: 200px;
      height: 5px;
      margin-right: 10px;
      border: 1px solid;
      border-radius: 5px;
      overflow: hidden;
      .water {
        position: absolute;
        left: 0;
        height: 100%;
        width: 100%;
        background: pink;
        transform: translateX(-100%);
        transition: all 0.4s;
      }
    }
  }
}
}
</style>
