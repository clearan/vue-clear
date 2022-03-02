// console.log(this)
// console.log(self)
importScripts('spark-md5.min.js')
self.onmessage = e => {
    const { fileChunk } = e.data;
    const spark = new self.SparkMD5.ArrayBuffer();
    let percentage = 0;
    let count = 0;
    const loadNext = index => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(fileChunk[index].myFile);
        reader.onload = e => {
            count++;
            spark.append(e.target.result);
            if (count === fileChunk.length) {
                self.postMessage({
                    percentage: 100,
                    hash: spark.end()
                });
                self.close();
            } else {
                percentage += 100 / fileChunk.length;
                self.postMessage({
                    percentage
                });
                // 递归计算下一个切片
                loadNext(count);
            }
        };
    };
    loadNext(0);
};
