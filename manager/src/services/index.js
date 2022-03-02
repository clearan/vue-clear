import axios from "axios";
import qs from 'qs'

function getUserRoutes(uid) {
    return axios({
        url: 'http://localhost:3000/user_router_auth',
        method: 'post',
        header: {
            'Content-type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify({uid})
    }).then(res => {
        return res.data
    }).catch(err => {
        throw err
    })
}

function getImages() {
    return axios({
        url: 'http://localhost:3000/getDateList',
        method: 'post',
    }).then(res => {
        return res.data
    }).catch(err => {
        throw err
    })
}

function uploadFile(data) {
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
       return data.index
   })
    // cancel('终止请求')
    return {promise, cancel}
    // return promise
}

function mergeRequest(data) {
    return axios({
        url: 'http://localhost:3000/merge',
        method: 'post',
        data
    }).then(res => {
        return res.data
    }).catch(err => {
        throw err
    })
}

function verifyUpload(data) {
    return axios({
        url: 'http://localhost:3000/verifyUpload',
        method: 'post',
        data
    }).then(res => {
        return res.data
    }).catch(err => {
        throw err
    })
}

export {
    getUserRoutes,
    getImages,
    uploadFile,
    mergeRequest,
    verifyUpload
}
