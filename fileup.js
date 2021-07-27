/**
 * Core code only, To upload and download any file by nodejs; 
 * # -*-coding:utf-8 -*-
 * # @Created on   : "Tuesday July 27 2021 11:00:37 GMT+0800 (China Standard Time)"
 * # @Author       : zorrow2017
 * # @File         : fileup.js
 * @Description    : <div>结论：用一个不依赖外部模块的纯nodejs文件在局域网中实现了任意文件通过浏览器的上传、下载、查看，需要一台电脑安装和运行nodejs；</div><br/> 
 * <div>用法：在http://nodejs.cn/ 下载nodejs和查看文档，用bat命令行（参考下面的function getBat();）运行本文件，在浏览器访问127.0.0.1:8088，，在utf-8编码的win10系统初步测试成功，本机上传800MB文件20秒，下载10秒；</div>
 */


// ￥{模块依赖}，只需要nodejs的核心模块，不依赖express、multiparty、multer等乱七八糟；
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const querystring = require('querystring');
const url = require('url');
const util = require('util');


// ￥{网站格局}，只有3个功能，上传、下载、查看；
// 127.0.0.1:8088/index.html
// 127.0.0.1:8088/fileup
// 127.0.0.1:8088/filedown
const gc_ip_port = 8088;
const gc_ip = '127.0.0.1:' + gc_ip_port;
const gc_page_index = '/index.html';
const gc_page_fileup = '/fileup';
const gc_page_filedown = '/filedown';

// ￥{全局变量}，
const gc_fdir = "D:\\fileup\\public\\";  //
const gc_time1 = new Date();  //
var gv_count = 0;
var gv_show = '';
doEnsureFdir(gc_fdir);  //若没有则创建gc_fdir文件夹


// ￥{服务器端}，使用HTTP/1.1协议，根据ietf.org/rfc/rfc1867.txt直接解析文件；
var server = http.createServer(
    /**
     * @description
     * @param request GET请求表示上传、下载、查看的功能，POST请求传输文件；
     * @param response 响应页面，下载文件，
     * @returns server
     */
    function (request, response) {
        // 统计网站访问次数
        gv_count++;
        gv_show = `total ${gv_count} clicks, goto ${request.url}; `;
        doLog(gv_show);

        // 获取请求参数
        var myurl = url.parse(request.url, true);    //console.log(params);  // true表示把querystring转化为json，false表示转化为字符串；
        var query = myurl.query;
        var pathname = myurl.pathname;  // likes '/fileup','/file/up.jsp'

        // 判断请求
        //判断请求：下载
        if (pathname === gc_page_filedown) {
            var filename = query['file'];  // http://127.0.0.1:8088/filedown?file=abc.mp4
            doFiledown(filename, response);
            return;
        }

        //判断请求：上传
        else if (pathname === gc_page_fileup) {
            gv_show = doFileup(request, response);
            doLog(gv_show);
            return;
        }

        //判断请求：查看，default 
        else if (pathname === gc_page_index) {
        }
        //default, 发送查看文件的响应数据
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(getPageIndex());
    });
//
server.listen(gc_ip_port);



//￥{function定义}，以doFiledown和doFileup为中心；
/**
 * @description 文件下载
 * @param filename 文件名（含路径）
 */
function doFiledown(filename, resp) {
    filepath = gc_fdir + filename;
    //
    fs.stat(filepath, function (error, state) {
        if (error) {
            doLog(error);
            return;
        }
        var fileSize = state.size;
        //
        var fileReadStream = fs.createReadStream(filepath, {
            encoding: 'binary',
            bufferSize: 1024 * 1024, //本地缓冲区1MB
            start: 0,
            end: fileSize
        });
        resp.writeHead(200, {
            'Content-Disposition': 'attachment; filename=' + encodeURI(filename),
            'content-type': 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'X-Requested-With',
            'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        });
        //
        fileReadStream.on('data', function (chunk) {
            //通过网络一次传64KB?
            resp.write(chunk, 'binary');
        });
        fileReadStream.on('end', function () {
            resp.end();
        });
    });
}

/**
 * @description 文件上传
 */
function doFileup(req, resp) {
    var fileControl = [];  //post报文的文件的控制信息，比如文件名、mime类型，但没有文件大小；
    var num = 0;    //总共出现了多少个\r\n，出现4个后则到了文件内容的真正开始；
    var isStart = false;  // 出现4个\r\n后isStart=true；
    var fileWriteStream;  //
    var filename = getDefaultFilename();
    //文件大小
    var fileSize = req.headers['content-length'];  //或许吧
    var time2 = new Date();

    // <form  method="post" enctype="multipart/form-data" 的报文格式如：function getPageIndex();
    //文件内容，function多次执行，每次读取64KB的chunk；
    req.on('data', function (chunk) {
        //!Important 每次读取64KB的chunk；
        var start = 0;
        var end = chunk.length;  // 65536=64KB
        var rems = [];

        for (var i = 0; i < chunk.length; i++) {
            if (chunk[i] == 13 && chunk[i + 1] == 10) {
                num++; //从头开始累计回车换行符个数；
                rems.push(i);

                //判断是否到了文件内容的真正开始，详见RFC1867或function getPageIndex()；
                if (num == 4) {
                    start = i + 2;
                    isStart = true;

                    //!Important 创建文件流，必须执行且仅执行一次；
                    var info = new Buffer(fileControl).toString();
                    filename = getControlFilename(info, filename);
                    fileWriteStream = fs.createWriteStream(filename);
                }
                //判断是否到了文件内容的尾部
                else if (i == chunk.length - 2) {
                    //说明到了数据尾部的\r\n
                    end = rems[rems.length - 2];
                    break;
                }
            }

            if (num < 4) {
                //4个\r\n之前的数据都是文件控制信息；
                fileControl.push(chunk[i]);
            }
        } //end for

        //!Important 向原著致敬： https://github.com/whxaxes/node-test/tree/master/server/upload ；
        if (isStart) {
            fileWriteStream.write(chunk.slice(start, end));
        }
    });

    //文件关闭
    req.on('end', function () {
        fileWriteStream.end();
        gv_show = `保存${filename}成功，占${fileSize}B空间；`;

        resp.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        resp.end('<div id="path">/' + filename + '</div><br/><br/><a href="/index.html">backward</a><br/>');
    });

    return gv_show;
}


/**
 * @description 日志输出
 */
function doLog(pv_show) {
    var ts = (new Date()).toString();
    console.log(ts + ' \t' + pv_show);
}

/**
 * @description 自动生成文件名，根据当前时间
 * @param repeat 如果文件名已存在，如何处理
 */
function getDefaultFilename(repeat) {
    var res = '';
    var dd = new Date();
    res = `f${dd.getFullYear()}-${dd.getMonth()}-${dd.getDate()}_${dd.getHours()}-${dd.getMinutes()}-${dd.getSeconds()}.01`;
    if (repeat === true) {
        var filename = gc_fdir + res;
        // TODO, 如果filename文件已存在，则应该怎么处理；
    }
    return res;
}

/**
 * @description 提取文件名，根据http post的文件控制信息
 */
function getControlFilename(info, filename) {
    try {
        var mt = info.match(/filename=".*"/g);
        filename = mt[0].split('"')[1];
    } catch (ex) {
        console.log(info);
        if (filename === undefined || filename.length === 0) {
            filename = 'error.02';
        }
    }
    var filepath = path.join(gc_fdir, filename);
    return filepath;
}

/**
 * @description 保证gc_fdir文件夹
 */
function doEnsureFdir(dirname) {
    //fs.mkdirSync(gc_fdir);报错
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (doEnsureFdir(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

/**
 * @description 文件夹遍历，但目前没有子文件夹，所有文件都放在同一个文件夹下面；
 */
function doTraverse(currentDirPath, ls) {
    var ls = [];  // 文件路径，文件名，修改时间，大小，文件夹大小和文件数；
    //
    fs.readdirSync(currentDirPath).forEach(function (filename) {
        var filePath = path.join(currentDirPath, filename);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            //TODO, callback(filePath, stat);
        } else if (stat.isDirectory()) {
            //ls.append([]);
            walkSync(filePath);
        }
    });
    //
    return ls;
}

/**
 * @description 给数字增加KB、MB、GB的单位
 */
function convertSize(fileSize) {
    if (isNaN(fileSize)) {
        return '0.0B';
    }
    var unit = ['B', 'KB', 'MB', 'GB', 'TB'];
    var res = '';
    //Number.MAX_SAFE_INTEGER=9 007 199 254 740 991;
    var val = Number.parseInt(fileSize);
    if (val <= 0) {
        res = '0B';
    } else {
        var jie = 0;
        while (val >= 1000) {
            jie += 1;
            val = val / 1024;
        }
        if (val <= 10) {
            res = val.toFixed(2) + unit[jie];
        } else {
            res = val.toFixed(1) + unit[jie];
        }
    }
    return res;
}


/**
 * @description 网站首页的html5，查看文件的html5
 */
function getPageIndex() {
    //网页首页
    var html = `<!DOCTYPE html>
<head>
<title>文件传输</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
Your Files: <mark>jdbc</mark>World\n<br/>
    <a href="">refresh</a><br/>
    <ol class="fileup_main_ol"></ol><br/><br/><br/>

    <section>
    <button type="button" onclick="goRoot()">/root</button>
    <button type="button" onclick="goBack()">backward</button>
    <button type="button" onclick="goFore()">forward</button>
    <button type="button" onclick="goChild()">/open</button>
    <button type="button" onclick="goPar()" title="go parent folder"> &nbsp;&nbsp;&nbsp;&nbsp;../&nbsp;&nbsp;&nbsp;&nbsp; </button>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <button type="button" onclick="doSelectAll()">select all</button>
    <button type="button" onclick="doInfo()">information</button>
    <button type="button" onclick="doRename()">rename</button>
    <button type="button" onclick="doCopy()">copy</button>
    <button type="button" onclick="doCut()">cut</button>
    <button type="button" ondblclick="doRemove()" title="double click">remove</button>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <button type="button" onclick="doDown()">download</button>
    <button type="button" onclick="doDownZip()">download zip</button>    
    <button type="button" onclick="doNewFolder()">new folder</button>
    <button type="button" onclick="doUpload()">upload</button>
    <br/>
    name: <input type="text" maxlength="40" name="rename" class="selfCloudMainRename" />
    <form  method="post" enctype="multipart/form-data" action="/fileup?up=qq">
        <button type="button" onclick="doRename()">rename</button>
        <button type="button" onclick="doNewFolder()">new folder</button>
        <br/>
        File chose: <input type="file" name="fileup" required />文件上传，看这一行，点前面的框选择文件；
<!--                <input name="fileCwd" hidden/>-->
        <button type="submit">commit</button>
        <span>mind that current work folder is <label class="selfCloudMainCwd"></label></span>
        <br/>
    </form>
</section>
<br/><br/>

<section>
    <table class="selfCloudMainList">
        <thead>
            <tr>
                <th><input type="checkbox" value="false" name="selector" onchange="doSelectAll()"/> ALL </th>
                <th>file name</th>
                <th>size</th>
                <th>information</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1 <input type="checkbox" value="1" name="selector"/> </td>
                <td>什么也没有</td>
                <td>000.0kb</td>
                <td>2021/05/07</td>
            </tr>
        </tbody>
    </table>
</section>
<br/><br/>
        </body>
    `;

    //替换文件列表
    var ol = '<ol class="fileup_main_ol"></ol>';
    var res = '<ol class="fileup_main_ol">\n';

    var ls_len = 0;
    var ls = []; // fs.readdirSync();
    var ls_name = [];
    //获取gc_fdir文件夹下面第一层的文件和子文件夹；文件夹树形结构还没有；
    fs.readdirSync(gc_fdir).forEach(function (filename) {
        var filepath = path.join(gc_fdir, filename);
        var stat = fs.statSync(filepath);
        if (stat.isFile()) {
            ls_name[ls_len] = filename;
            ls[ls_len++] = ` --${convertSize(stat.size)}  --${stat.mtime}`; //--${filename}  
        } else if (stat.isDirectory()) {
            ls_name[ls_len] = filename;
            ls[ls_len++] = filename + '  --is folder';
        }
    });
    //TODO, 以后要实现html按钮的功能；
    //把列表ls转化为<ol>；不能文件夹树形结构操作；
    for (var i = 0; i < ls_len; i++) {
        var item = ls[i];
        var filename = ls_name[i];
        res += `<li><a href="/filedown?file=${encodeURI(filename)}">${filename}</a> ${item}</li>\n`;
    }
    res += '</ol>';

    //直接替换
    html = html.replace(ol, res);
    return html;
}

/**
 * @description form文件上传报文
 */
function getPageHttp() {
    //原汁原味的http文件form上传报文，回车换行符总共11个，二进制的(data)的内容postman找不到；
    var http = `POST /fileup HTTP/1.1
Host: 127.0.0.1:8088
Content-Length: 265
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="fileup"; filename="/C:/Users/zorrow2017/Desktop/物料主数据导入模板(3).xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

(data)
----WebKitFormBoundary7MA4YWxkTrZu0gW
`;  // post的data数据是从“----WebKit...”开始到“----WebKit...”的字符串；
    return http;
}

/**
 * @description 运行nodejs文件的bat脚本
 */
function getBat() {
    var atFirst = `下载nodejs`;
    var atSecond = `把本文件保存为d:\\fileup\\fileup.js`;   //d:\fileup\fileup.js
    var atThird = `把下面的batFile引号里面的字符串复制粘贴到新建文件d:\\fileup\\fileup.bat里面；`;
    var batFile = `
echo "fileup.js开始启动，正常应该停在（node "d:\fileup\fileup.js"）这里，然后在浏览器访问127.0.0.1:8088，可以尝试鼠标右击bat窗口 "

::如果配置了nodejs环境变量，那就方便了
::node "d:\fileup\fileup.js" 
::如果没有配置nodejs环境变量，<<<!Important 自己看着改下面的代码
d:
::cd到nodejs的安装目录，就看node.exe所在文件夹，"D:\General\node-v14.16.1-win-x64\node.exe"；
cd "D:\General\node-v14.16.1-win-x64\"
.\node "d:\fileup\fileup.js" 
::正常应该停在这里，可以尝试鼠标右击bat窗口
::如果报错8088端口被占用，那就在上面的js文件中改改这句（const gc_ip_port = 8088;）；

::不要关闭bat窗口，如果bat窗口闪退，那么可能是bat文件错误、Windows环境错误、js代码错误；
pause
`;
    var atFifth = '在本电脑的浏览器输入127.0.0.1:8088测试，在同一个局域网其他设备的浏览器输入192.168.0.4:8088测试';
    var atSixth = "如果还不行，建议放弃治疗；";
    return '在Windows的cmd输入node "d:\fileup\fileup.js"来运行nodejs文件 ';
}



//@deprecated 垃圾代码回收站
/*
var gc_ip_port=Number.parseInt(gc_ip.split(':')[1].trim());

request.on('data', function (chunk) {
        posts += chunk;
    });

var query=myurl.query;  // json querystring

    try {
        //fs.statSync(path.join(fdir, 'upload'));
        fs.statSync(dirname);
    } catch (ex) {
    }

*/
