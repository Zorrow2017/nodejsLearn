tp
============
a small original basic https website, using node.js. 


File structure
------------

#### tp
>src/
>>main/
>>>nodejs/
>>>>com/fengmu/tp/(empty)
>>>>com.fengmu.tp/
>>>>>requireVar.js
>>>>>server.js
>>>>>(3 unused files)
>>>resources/
>>>>CA/
>>>>>(ssl key files for https)
>>>>fileSave/
>>>>>(temp files)
>>>>mysql/(empty)
>>>webapp/(redirect to down 15th line)
>>test/
>>>nodejs/
>>>>com/fengmu/tp/(empty)
>>>>com.fengmu.tp/
>>>>>test.js
>>>selenium/
>target/(empty)
>.gitignore
>README.md
>package.json
>package-lock.json

##### webapp
>META-INF
>>context.xml
>WEB-INF
>>web.xml
>static
>>assets
>>>css
>>>>allPage.css
>>>etc
>>>js
>>>>fileup.js
>>>>jquery-3.3.1.js
>>>multimedia
>>>picture
>>>>jd.ico
>>>>(other 3 pictures)
>>>text
>>microchat/(empty)
>>tool
>>>fileup.html
>>>remove.html
>>>yylj.html
>index.html

#### Introduction
only one used page: https://127.0.0.1:4436/tp/fileup
all servers at one nodejs: server.js 
allPage.css and fileup.js support fileup.html; 
requireVar.js, server.key, server.crt support server.js;
all other files are useless! 
This node.js project structure references maven, you may find a folder named "nbproject" because the IDE to edit this project is netbeans8.2; 

#### License:  tp  v1.0.2  since 2020/07/27  by zorrow2017  in cn



Usage
------------

#### to run: 
download all "dependencies" in package.json (but in v1.0.2, just this version, you need not download any module *^__^*)
change `absPath` in file requireVar.js(line: 31)
run server.js, you may cd and enter "node server.js" in Windows cmd
go to https://127.0.0.1:4436/tp/fileup in your browser

#### to develop: 
folder "target" and "src/test" just inherit from maven;
file "package.json" "package-lock.json" ".gitignore" "README.md" inherit from git; 
node.js file are saved at "src/main/nodejs/com.fengmu.tp/": 
>>requireVar.js defines modules to import(require), likes stdfix.h in c/c++
>>mytool.js defines basic functions, objects, variables,,,
>>server.js get all httpRequest, deal(control), and send httpResponse; 
"resources" save many different files
>>CA, generated ssl files. read server.wincmd to learn, search Internet to learn more; 
static web resources are saved at "src/main/webapp/static/": 
>>"../index.html" home page
>>"tool" many useful small tools writed by pure html5+css3+js(not node.js)
>>>"fileup.html" to upload and download file
>>>"remove.html" a game, click number block near 0 block to let the numbers look ordered in some way
>>>"yylj.html" waiting for your efforts
>>"microchat" waiting for your efforts
>>"assets" save css, js, text, image, mp3, mp4, etc files which will be used by *.html



Author story
------------

I'm learning git, nodejs, npm, maven, and will learn sass, less, veu, rect to improve myself and hunt for a good job.
Study and writing and devoting can be the most precious pleasure in our life. 


