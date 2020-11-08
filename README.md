# 外语考试听力音频快速制作工具

本工具可以帮助您快速制作外语考试中听力部分的音频，方便、快捷。安装好后，使用时，只需几分钟，您就可以完成外语考试中听力部分的音频制作。
此外，本工具使用Google云文字转语音服务进行语音合成，语音质量较好。
目前本工具支持英语的听力考试音频制作，默认的模板是广西北部湾经济区初中学业水平考试中英语考试的听力部分。对其他语种的支持将在未来添加，或者您也可以自行修改代码添加。

## 安装
1. 下载源码，放置于可以运行PHP，且可以访问Google服务的服务器上。
2. 按照[Google的说明](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries#before-you-begin)操作，取得您的密钥文件。
3. 将您的密钥文件放置在您的服务器上，编辑`config.php`文件，并修改`/path/to/your/key.json`路径使其指向您的密钥文件。
4. 按照[Google的说明](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries#install_the_client_library)安装Google云服务的客户端PHP运行库。请在您放置本工具代码的目录下运行Google说明中提到的`composer`指令。另外，此客户端PHP运行库需要有PHP的扩展组件`ext-bcmath`，请记得装上。
5. 安装完成！在浏览器中访问您的服务器，指向到本工具的`index.html`即可使用。

## 使用
1. 默认的模板是广西北部湾经济区初中学业水平考试中英语考试的听力部分。您可以直接在界面上修改参数来适应您的考试要求，也可以编辑`doc.js`，修改其中`paper`变量，来产生您的考试的模板。其中，各键值内容对应如下：
```
            "examTitle": "广西北部湾经济区初中学业水平测试。英语。听力测试。",  //考试的标题
            "examEnding": "听力测试到此结束。",   //考试结束语
            "questions": [{   //题目区
                "ques": "（一）听句子，选图片。你将听到五个句子，请在下列六幅图中，选出与所听句子内容相符的图片。每个句子读一遍。",    //题干
                "rate": "0.77",   //语速
                "quesbreak1": "3",   //浏览时长（秒）
                "quesbreak2": "5",   //作答时长（秒）
                "quesrepeat": "1",   //重复次数
                "quesbreak3": "0",   //重复间隔（秒）
                "quesarttype": "1"   //原文类型，1=一行一个句子，2=一段对话，3=一段短文
            }
            ]
```
2. 使用时，请准备好您的听力原文，尽量确保原文内容无误，以免需要重做；
    (1) 首先选好外语男、女语音，可以点击试听来试听该声音；
    (2) 然后，编辑考试标题，注意适当添加句号或逗号来使朗读适当停顿；
    (3) 接着，逐题将原文填入输入框，注意输入框内的说明，特别是对话类题目，需要每一段开头都有说话人标记，如`M:`或`W:`，并确保有“：”来分隔说话人和说话内容；
    (4) 最后，点击`播放`按钮聆听，以检查；
    (5) 待`保存音频`按钮亮起，即可点击保存为音频文件。

本项目使用了 [Google Cloud Services](https://cloud.google.com/text-to-speech/), [jQuery](https://www.jquery.com/), [audiobuffer-to-wav.js](https://github.com/Jam3/audiobuffer-to-wav), [Bootstrap](https://getbootstrap.com/).

---------

# Easy Listening Test Audio Maker

(ENGLISH VERSION COMING SOON.) This tool uses Google Cloud Text to Speech Wavenet voices to help you quickly generate high-quality audio for the listening tests of your exams with ease. Once setup, all you need is a few minutes (and a few clicks) to make the audio for your listening test (if you have your transcript ready of course ;-P).
At the moment, in this tool, the source language (i.e. the language that the examinees speak) is Chinese, and the target language (i.e. the language in which the examinees are about to take exams on) is English. Support for other languages will be added in the future.

## Setup
1. Clone this repo. Place it somewhere that can run PHP and reach Google.
2. Follow [Google's guide](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries#before-you-begin) to Step 4 and obtain your key file.
3. Place your key file on your server. Edit `config.php` and replace `/path/to/your/key.json` with the path to your key file.
4. Follow [Google's guide](https://cloud.google.com/text-to-speech/docs/quickstart-client-libraries#install_the_client_library) to install Google Cloud's client library for PHP for text-to-speech. Be sure to run the `composer` command in the directory where you place this repo. Furthermore, this client library for PHP requires the extension `ext-bcmath`, be sure to have it installed.
5. Enjoy!

## Usage
1. The default layout is from an English exam in Nanning, China. You can edit the parameters directly on the page, or you can edit the `paper` variable in `doc.js` to make your own layout. The meaning of each keys are as follows:
```
            "examTitle": "",  //Title of the exam
            "examEnding": "",   //Ending of the exam
            "questions": [{   
                "ques": "",    //Instruction for this part.
                "rate": "0.77",   //Speaking rate
                "quesbreak1": "3",   //Break for reading through the questions (in sec)
                "quesbreak2": "5",   //Break for answering the questions (in sec)
                "quesrepeat": "1",   //Times of repetition
                "quesbreak3": "0",   //Break between each repetition (in sec)
                "quesarttype": "1"   //Type of the content，1=Sentences, one at a line; 2=A conversation; 3=A passage
            }
            ]
```
2. Have your transcript ready. Make sure it is the "final version".
    (1) Choose a desired male and female voice for the target language.
    (2) Edit the title of the exam.
    (3) Enter the content for each part. Make sure it conforms to the requirement written in the text area, especially for the conversations - make sure each line is started with `M:` or `W:` to indicate which voice to use for this line. 
    (4) Press `Play`.
    (5) When `Save Audio` is available, press it to save the speech to an audio file.

This project uses [Google Cloud Services](https://cloud.google.com/text-to-speech/), [jQuery](https://www.jquery.com/), [audiobuffer-to-wav.js](https://github.com/Jam3/audiobuffer-to-wav), [Bootstrap](https://getbootstrap.com/).
