# 使用

直接使用build分支中js文件放入karin项目内/plugins/karin-plugin-example目录下

建议直接在/plugins目录中使用`git clone -b build https://github.com/jacksixth/karin-plugin-jacksixth-app.git`拉取,后续有更新可以直接`git pull`拉取更新

或者下载releases里的压缩包放如 /plugins

# 功能

1. bilibili 链接解析 -> bilibili.js
   大概长这样

   ![1748506825783](image/README/1748506825783.png)
2. 每日定时获取新闻摸鱼日报发群里-> moyuribao.js

   需要在js文件中配置定时发布的时间与群号 看js文件中的注释
   
3. 执行js代码->runCode.js

   ```
   #rjs console.log("Hello, World!");
   ```
