<template>
<div class="clipImageBox">
  <div class="row">
    <div class="canvasBox" @mousedown="mousedown" @mousemove="mousemove" @mouseup="mouseup">
      <canvas ref="canvas" :width="cw" :height="ch"></canvas>
      <div class="mark" v-show="isShowMark"></div>
    </div>
    <div class="image-box"><img :src="imageUrl" alt=""></div>
  </div>
  <div class="buttonBox">
    <input type="file" accept="image/*" style="display: none" @change="uploadFile" ref="file">
    <button @click="handleClick">选择图片</button>
    <button @click="scale(0)">放大</button>
    <button @click="scale(1)">缩小</button>
    <button @click="saveImage">保存图片</button>
  </div>
</div>
</template>

<script>
import axios from "axios";

export default {
  name: "Canvas",
  data() {
    return {
      filename: '',
      ctx: null,
      imageUrl: '',
      // 画布大小
      cw: 0,
      ch: 0,
      // mark遮罩层
      mw: 0,
      mh: 0,
      ml: 0,
      mt: 0,
      // 图片
      iw: 0,
      ih: 0,
      il: 0,
      it: 0,
      isShowMark: false,
      img: null,
      moveFlag: false,
      startX: 0,
      startY: 0,
      moveX: 0,
      moveY: 0,
    }
  },
  methods: {
    mousedown(e) {
      if (!this.img) return
      this.startX = e.clientX
      this.startY = e.clientY
      this.moveFlag = true
    },
    mousemove(e) {
      // 将startX当作移动中上次的坐标有助于理解。
      if (!this.moveFlag) return
      this.moveX = e.clientX - this.startX
      this.moveY = e.clientY - this.startY
      this.il += this.moveX
      this.it += this.moveY
      this.drawImage()
      // 移动过程中将上次的坐标更新为当前坐标，便于55行用最新的坐标减去上次的坐标
      this.startX = e.clientX
      this.startY = e.clientY
    },
    mouseup() {
      if (!this.img) return
      this.moveFlag = false
    },
    scale(flag) {
      if (!this.img) return
      // 放大缩小时，宽高比例保持不变
      const w = 20
      const x = this.iw / this.ih
      const h = w / x
      if (flag) {
        this.iw -= w
        this.ih -= h
      } else {
        this.iw += w
        this.ih += h
      }
      this.drawImage()
    },
    handleClick() {
      this.$refs.file.click()
    },
    uploadFile(e) {
      this.isShowMark = true
      const file = e.target.files[0]
      this.filename = file.name
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file)
      fileReader.onload = ev => {
        // 创建新图片
        this.img = new Image()
        this.img.src = ev.target.result
        this.img.onload = _ => {
          this.iw = this.img.width
          this.ih = this.img.height
          // 为将图片全部显示在canvas中，对img宽高作等比缩放
          // 宽 > 高，以宽为基准，将图片的宽调整为与canvas的宽相等，得到原来的图片宽与canvas宽的比n，图片现在的高同样缩放n倍
          let n;
          if (this.iw > this.ih) {
            n = this.iw / this.cw
            this.iw = this.cw
            this.ih = this.ih / n
          } else {
            n = this.ih / this.ch
            this.ih = this.ch
            this.iw = this.iw / n
          }
          // 图片水平垂直居中
          this.il = (this.cw - this.iw) / 2
          this.it = (this.ch - this.ih) / 2
          this.drawImage();
          const mark = document.querySelector('.mark').getBoundingClientRect()
          this.mw = parseInt(mark.width)
          this.mh = parseInt(mark.height)
          this.ml = parseInt((this.cw - this.mw) / 2)
          this.mt = parseInt((this.ch - this.mh) / 2)
        }
      }
    },
    drawImage() {
      this.ctx = this.$refs.canvas.getContext('2d')
      this.ctx.clearRect(0, 0, this.cw, this.ch) // 清除画布，canvas的原点和canvas画布的宽高，这个范围的清除
      this.ctx.drawImage(this.img, this.il, this.it, this.iw, this.ih)
    },
    saveImage() {
      if (!this.img) return
      // 获取mark遮罩层下的像素点
      const imageData = this.ctx.getImageData(this.ml, this.mt, this.mw, this.mh)
      // 需要新建一个canvas，原因：需要一个干净的canvas来生成图片的base64地址，传给后端。当前的canvas已经有image了，会污染toDataURL生成全新的图片url
      const newCanvas = document.createElement('canvas')
      newCanvas.width = this.mw
      newCanvas.height = this.mh
      newCanvas.getContext('2d').putImageData(imageData, 0, 0)
      newCanvas.toBlob((blob => {
        console.log(blob)
        const formData = new FormData()
        formData.append('imageFile', blob)
        formData.append('filename', this.filename)
        axios({
          url: 'http://localhost:3000/canvasUpload',
          method: 'post',
          data: formData
        }).then(res => {
          console.log(res)
        })
      }))
      this.imageUrl = newCanvas.toDataURL('image/png')
    },
  },
  mounted() {
    const canvas = document.querySelector('canvas').getBoundingClientRect()
    this.cw = parseInt(canvas.width)
    this.ch = parseInt(canvas.height)
  }
}
</script>

<style scoped lang="scss">
.clipImageBox {
  .row {
    display: flex;
    margin-bottom: 10px;
    .canvasBox {
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      width: 400px;
      height: 400px;
      canvas {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 2px solid orangered;
      }
      .mark {
        position: absolute;
        width: 70%;
        height: 70%;
        //left: 50%;
        //top: 50%;
        //transform: translate(-50%,-50%);
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        border: 1px dashed #cccccc;
        background: rgba(0, 0, 0, 0.2);
      }
    }
    .image-box {
      margin-left: 30px;
    }
  }
}

</style>
