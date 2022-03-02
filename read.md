- npm i koa
- npm i koa-generator -g
- koa2 project-name
- cd project-name
- npm install
- npm i koa2-cors -S 跨域
- npm run dev
### 一个node.js的项目如何开启debug,可以debug前端请求
```text
找到 Run->Edit Configurations
Working directory 选择项目根目录
Javascript file 选择package.json中启动项目运行的的脚本文件
```

### 查看并kill掉占用端口
```text
查看3000端口被哪个应用占用：netstat -ano |findstr 3000
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       22872
通过id 22872查找对应的进程名称 tasklist |findstr 22872
node.exe                     22872 Console                    1     36,464 K
杀掉进程：taskkill /f /t /im "进程id或者进程名称"
```
