(() => {
  const inputImage = document.getElementById("source")
  const state = { uploadedImage: null }
  const start = document.getElementById("start")

  inputImage.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if(!file){
      alert("ファイルが選択されていません")
      return
    }

    const reader = new FileReader()
    // 画像データの読み出しとスクリプト内での保持
    reader.onload = ev => state.uploadedImage = ev.target.result
    
    reader.readAsDataURL(file)
  })
  
  start.addEventListener("click", () => {
    if(!state.uploadedImage) {
      alert("ファイルが選択されていません")
      return
    }
    const image = new Image()

    // imageのロード処理を定義
    image.onload = () => {
      const gif = new GIF({
        workerScript: "public/gif.worker.js",
        workers: 2,
        quality: 10,
        width: image.width,
        height: image.height
      })
      // canvas x20 にそれぞれ20度ずつ色変更したデータを描画する
      for (let i = 0; i < 20; i++) {
        const canvas = document.createElement("canvas")

        const ctx = canvas.getContext("2d")
        canvas.width = image.width
        canvas.height = image.height
        ctx.drawImage(image, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        for (let j = 0; j < data.length; j += 4) {
          const color = rgbToHSL(data[j], data[j + 1], data[j + 2])
          color.h = (color.h + i * 15) % 360
          const rgb = hslToRGB(color.h, color.s, color.l)
          data[j] = rgb.r
          data[j + 1] = rgb.g
          data[j + 2] = rgb.b
        }

        ctx.putImageData(imageData, 0, 0)
        gif.addFrame(ctx, {delay: 100})
      }

      gif.on('finished', (blob) => {
        window.location = URL.createObjectURL(blob)
      })
      gif.render()
    }
    // 画像データのセット
    image.src = state.uploadedImage
  })

  const rgbToHSL = (r, g, b) => {
    r /= 255, g /= 255, b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
        h = s = 0
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0) 
            break
            case g: h = (b - r) / d + 2 
            break
            case b: h = (r - g) / d + 4 
            break
        }
        h /= 6
    }
    return { h: h * 360, s: s, l: l }
  }

  const hslToRGB = (h, s, l) => {
    let r, g, b
    if (s === 0) {
        r = g = b = l
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        h /= 360
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }
})()