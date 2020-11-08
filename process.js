const serverPrefix = "";  //Always ends it with a "/"
var jsonQueue = [];
var audioQueue = [];
var playerPointer = -1;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var staticAudio = [];
var audioRecycled = [];
var jsonRecycled = [];

function isChinese(str) {
    var patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
    if (!patrn.exec(str)) {
        return false;
    } else {
        return true;
    }
}

function insertText(str) {
    let obj = $("#t").get(0);
    if (document.selection) {
        var sel = document.selection.createRange();
        sel.text = str;
    } else if (typeof obj.selectionStart === 'number' && typeof obj.selectionEnd === 'number') {
        var startPos = obj.selectionStart,
            endPos = obj.selectionEnd,
            cursorPos = startPos,
            tmpStr = obj.value;
        obj.value = tmpStr.substring(0, startPos) + str + tmpStr.substring(endPos, tmpStr.length);
        cursorPos += str.length;
        obj.selectionStart = obj.selectionEnd = cursorPos;
    } else {
        obj.value += str;
    }
    $("#t").focus();
    $("#t").change();
}

function insertTxt(text, index, insert) {
    let start = text.substring(0, index);
    let end = text.substring(index);
    return (start + insert + end);
}

function wrapText(openTag, closeTag) {
    var textArea = $('#t');
    var len = textArea.val().length;
    var start = textArea[0].selectionStart;
    var end = textArea[0].selectionEnd;
    var selectedText = textArea.val().substring(start, end);
    var replacement = openTag + selectedText + closeTag;
    textArea.val(textArea.val().substring(0, start) + replacement + textArea.val().substring(end, len));
    $("#t").focus();
    $("#t").change();
}

function sleep(interval) {
    return new Promise(resolve => {
        setTimeout(resolve, interval);
    })
}

function process() {

    console.log("Start processing input... -->");
    var defaultVoice = $("#mainform").find("#voice").val();
    var defaultRate = $("#mainform").find("#speed").val();
    var text = $("#t").val();
    console.log("Voice:" + defaultVoice);
    console.log("Rate: " + defaultRate);

    if (text.indexOf("<audio id=") != -1) {
        let findAudio = new RegExp(/<audio id="([0-9]+)"/gmi);
        let result;
        while ((result = findAudio.exec(text)) != null) {
            if (staticAudio[Number(result[1])] == undefined) {
                return false;
            }
        }
    }

    if (defaultVoice.indexOf("cmn-CN") == -1) {
        let findChinese = new RegExp(/(([^"><][0-9（“《\u4E00-\u9FA5\uFE30-\uFFA0]+[（“《\u4E00-\u9FA5\uFE30-\uFFA0]+[0-9（“《\u4E00-\u9FA5\uFE30-\uFFA0]+[，。？！”…》）\n]*)+)/gim);
        if (findChinese.exec(text) != null) {
            text = text.replace(findChinese, "<voice name='" + $("#zh_CN > option:nth-child(3)").val() + "'>$1</voice>");
        }
        let findDuplicate = new RegExp(/(<voice name[A-z 0-9='"][^>]*?>)([0-9\., \u3002\uff1b\uff0c\uff1a\u201c\u201d\uff08\uff09\u3001\uff1f\u300a\u300b]*?)(<voice name=[\s\S]*?>)(([\u4E00-\u9FA5\s]|[\uFE30-\uFFA0\s])+)<\/voice>([0-9\., \u3002\uff1b\uff0c\uff1a\u201c\u201d\uff08\uff09\u3001\uff1f\u300a\u300b]*?)<\/voice>/gim);
        text = text.replace(findDuplicate, "$1$2$4$6</voice>");
    }

    if (text.indexOf("<voice name=") != -1) {
        let findVoice = new RegExp(/(<voice name[A-z 0-9='"][^>]*?>)/gmi);
        text = text.replace(findVoice, "\n$1\n");
        findVoice = new RegExp(/(<\/voice>)/gmi);
        text = text.replace(findVoice, "\n$1\n");
    }

    if (text.indexOf("<break time=") != -1) {
        let findBreak = new RegExp(/(<break time='[0-9ms]+'[ ]*?\/>)/gmi);
        text = text.replace(findBreak, "\n$1\n");
    }

    if (text.indexOf("<audio src=") != -1 || text.indexOf("<audio id=") != -1) {
        let findAudio = new RegExp(/<audio ((src="[\s\S]+"[ ]*?)|(id="[0-9]+"[ ]*?)|(id="[0-9]+"[ ]*? name="([\S ][^\/"]+)"))\/>/gmi);
        let result, insertCount = 0, tmpStr = text;
        while ((result = findAudio.exec(text)) != null) {
            tmpStr = insertTxt(tmpStr, result.index + insertCount * ("\n".length), "\n");
            insertCount++;
            tmpStr = insertTxt(tmpStr, findAudio.lastIndex + insertCount * ("\n".length), "\n");
            insertCount++;
        }
        text = tmpStr;
    }

    if (text.indexOf("<repeat ") != -1) {
        let findRepeat = new RegExp(/(<repeat count='[0-9]+'>)(([\S\s](?!<repeat))+)(<\/repeat>)/gmi);
        let result, insertCount = 0, tmpStr = text;
        while ((result = findRepeat.exec(text)) != null) {
            if (result[2].includes("<voice name") || result[2].includes("</voice>")) {
                tmpStr = insertTxt(tmpStr, result.index + insertCount * ("\n".length), "\n");
                insertCount++;
                tmpStr = insertTxt(tmpStr, text.indexOf(result[1], result.index) + insertCount * ("\n".length) + result[1].length, "\n");
                insertCount++;
                tmpStr = insertTxt(tmpStr, text.indexOf(result[4], result.index) + insertCount * ("\n".length), "\n");
                insertCount++;
                tmpStr = insertTxt(tmpStr, findRepeat.lastIndex + insertCount * ("\n".length), "\n");
                insertCount++;
            } else {
                let thistext = result[2];
                thistext = thistext.replace(/\n/gm, " ");
                tmpStr = tmpStr.replace(result[2], thistext);
            }
        }
        text = tmpStr;
    }

    var paras = text.split("\n");
    console.log("Paragraphs:" + paras);

    let repeatStart = -1;
    let repeatCount = 1;
    let tempVoice = "";
    let tempRate = "";
    let tempPitch = 0;

    for (let i = 0; i < paras.length; i++) {
        if (paras[i].trim() != "") //not blank
        {
            if (/(<voice[^>])/.test(paras[i]) && paras[i].indexOf("</voice>") == -1) {
                $("<xml>" + paras[i] + "</voice></xml>").find('voice').each(function () {
                    console.log("A voice tag for multi-line defines voice " + $(this).attr("name"));
                    tempVoice = $(this).attr("name");
                    tempRate = $(this).attr("rate") != undefined ? $(this).attr("rate") : "";
                    tempPitch = $(this).attr("pitch") != undefined ? $(this).attr("pitch") : 0;
                });
            } else if (paras[i].indexOf("</voice>") != -1) {
                tempVoice = "";
                tempRate = "";
                tempPitch = 0;
            } else if (/(<audio src[^>])/.test(paras[i])) {
                $("<xml>" + paras[i] + "</xml>").find('audio').each(function () {
                    let t = $(this).attr("src");
                    console.log("An audio file: " + t + " will be played.");
                    makeJSON(t, -1);
                });
            } else if (/(<audio id[^>])/.test(paras[i])) {
                $("<xml>" + paras[i] + "</xml>").find('audio').each(function () {
                    let t = $(this).attr("id");
                    console.log("staticAudio #" + t + " will be played.");
                    makeJSON(t, -2);
                });
            } else if (/(<repeat[^>])([\s\S]+)(<\/repeat>)/.test(paras[i])) {
                $("<xml>" + paras[i] + "</xml>").find('repeat').each(function () {
                    console.log("The text:" + $(this).text() + " will be read  " + $(this).attr("count") + " times");
                    paras[i] = paras[i].replace(/(<repeat[\s\S]*?>)([\s\S]*?)(<\/repeat>)/, "<seq><media repeatCount='" + $(this).attr("count") + "'><speak> $2 </speak></media></seq>");
                    i--; //Just in case there is a voice tag inside, don't makeJSON now and let the line be processed again.
                });
            } else if (/(<repeat[^>])/.test(paras[i]) && paras[i].indexOf("</repeat>") == -1) {
                $("<xml>" + paras[i] + "</repeat></xml>").find('repeat').each(function () {
                    repeatCount = $(this).attr("count");
                });
                repeatStart = i;
                paras[i] = "";
                console.log("Found a start of a repeat of " + repeatCount + " times at line " + i);
            } else if (paras[i].indexOf("</repeat>") != -1) {
                console.log('Found the end of a repeat at line ' + i);
                if (repeatStart > -1) i = repeatStart;
                if (repeatCount > 2) {
                    repeatCount--;
                    console.log("Repeating the " + repeatCount + "time");
                } else {
                    paras[i] = "";
                    repeatStart = -1;
                    repeatCount = 1;
                }
            } else {
                if (tempVoice == "") {
                    makeJSON(paras[i], defaultVoice, defaultRate);
                    console.log(paras[i] + " will be read by defaultVoice.");
                } else {
                    makeJSON(paras[i], tempVoice, tempRate == "" ? defaultRate : tempRate, tempPitch != 0 ? tempPitch : undefined);
                    console.log(paras[i] + " will be read by " + tempVoice + ".");
                }
            }

        }
    }

    console.log("Now the jsonQueue looks like:" + jsonQueue);
    console.log("<-- Process complete.");
    return true;
}

function makeJSON(text, voice, rate, pitch) {
    let findBreak;
    if (voice == -1) {
        var json = "{ \"audio\" : \"" + text + "\" }";
    } else if (voice == -2) {
        var json = "{ \"audioid\" : \"" + text + "\" }";
    } else if ((findBreak = /^<break time='([0-9ms]+)'[ ]*?\/>$/.exec(text.trim())) != null) {  //Generate single-lined <break> locally
        let findSec = /([0-9]+)(ms|s)/.exec(findBreak[1]);
        let sec = (findSec[2] == "ms" ? findSec[1] / 1000 : findSec[1]);
        var json = "{ \"break\" : " + sec + " }";
    } else {
        text = text.replace(/"/g, "'");
        text = text.replace(/&/g, " and ");
        text = text.replace(/	/g, " ");
        var json = "{ \"input\": { \"ssml\" : \"<speak> " + text + " </speak>\" }, \"voice\": {\"name\": \"" +
            voice + "\"}, \"audioConfig\":{\"audioEncoding\": \"OGG\", \"speakingRate\": " + rate + (pitch == undefined ? "" : ",\"pitch\":" + pitch) + "} }";
    }
    console.log("JSON:" + json);
    jsonQueue.push(json);
}

function optimizeJSON() {
    for (let i = 0; i < jsonQueue.length; i++) {
        if (jsonQueue[i].indexOf("ssml") != -1) {
            let thisjson = JSON.parse(jsonQueue[i]);
            let thistext = thisjson.input.ssml;
            thistext = (/<speak>([\s\S]+)<\/speak>/.exec(thistext))[1].trim();
            let leftoverOpenedTags = new RegExp(/^<(prosody|sub|phoneme|say-as|par|seq|media)[^>]*?>$/gmi);
            if (leftoverOpenedTags.exec(thistext) != null) {
                if (i < jsonQueue.length - 1) {
                    let jobDone = false;
                    for (let j = i + 1; j < jsonQueue.length; j++) {
                        if (jsonQueue[j].includes("ssml")) {
                            let nextjson = JSON.parse(jsonQueue[j]);
                            let nexttext = nextjson.input.ssml;
                            nexttext = (/<speak>([\s\S]+)<\/speak>/.exec(nexttext))[1];
                            if (/^<break time='[0-9ms]+' \/>$/.exec(nexttext.trim()) == null) {
                                nexttext = thistext + nexttext;
                                nextjson.input.ssml = "<speak>" + nexttext + "</speak>";
                                jsonQueue[j] = JSON.stringify(nextjson);
                                jsonQueue.splice(i, 1);
                                i--;
                                jobDone = true;
                                break;
                            }
                        }
                    }
                    if (!jobDone) {
                        jsonQueue.splice(i, 1);
                        i--;
                    }
                } else {
                    jsonQueue.splice(i, 1);
                    i--;
                }
            }
            let leftoverCloseTags = new RegExp(/^<\/[\S]*?>$/gmi);
            if (leftoverCloseTags.exec(thistext) != null) {
                if (i > 0) {
                    let jobDone = false;
                    for (let j = i - 1; j > 0; j--) {
                        if (jsonQueue[j].includes("ssml")) {
                            let prevjson = JSON.parse(jsonQueue[j]);
                            let prevtext = prevjson.input.ssml;
                            prevtext = (/<speak>([\s\S]+)<\/speak>/.exec(prevtext))[1];
                            if (/^<break time='[0-9ms]+' \/>$/.exec(prevtext.trim()) == null) {
                                prevtext = prevtext + thistext;
                                prevjson.input.ssml = "<speak>" + prevtext + "</speak>";
                                jsonQueue[j] = JSON.stringify(prevjson);
                                jsonQueue.splice(i, 1);
                                i--;
                                jobDone = true;
                                break;
                            }
                        }
                    }
                    if (!jobDone) {
                        jsonQueue.splice(i, 1);
                        i--;
                    }
                } else {
                    jsonQueue.splice(i, 1);
                    i--;
                }
            }
        }
    }

    let usedVoices = [];
    let usedRates = [];
    for (let i = 0; i < jsonQueue.length; i++) {
        if (jsonQueue[i].indexOf("ssml") != -1) {
            let thisjson = JSON.parse(jsonQueue[i]);
            let thisvoice = thisjson.voice.name;
            let thisrate = thisjson.audioConfig.speakingRate;
            usedVoices.push(thisvoice);
            usedRates.push(thisrate);
            if (i > 0) {
                if (thisvoice == usedVoices[i - 1] && thisrate == usedRates[i - 1]) {
                    let newssml = jsonQueue[i - 1].substring(0, jsonQueue[i - 1].indexOf("</speak>\"")) + jsonQueue[i].substring(jsonQueue[i].indexOf("\"<speak>") + 8);
                    jsonQueue[i] = newssml;
                    jsonQueue.splice(i - 1, 1);
                    usedVoices.splice(i - 1, 1);
                    usedRates.splice(i - 1, 1);
                    i--;
                }
            }
        } else {
            usedVoices.push("");
        }
    }

    let startofTags = [];
    let startofTagsName = [];
    let startofTagsIndex = [];
    for (let i = 0; i < jsonQueue.length; i++) {
        if (jsonQueue[i].indexOf("ssml") != -1) {
            let thisjson = JSON.parse(jsonQueue[i]);
            let thistext = thisjson.input.ssml;
            thistext = (/<speak>([\s\S]+)<\/speak>/.exec(thistext))[1];
            if (/^<break time='[0-9ms]+' \/>$/.exec(thistext.trim()) == null) {
                let findStartofTag = new RegExp(/<(prosody|sub|phoneme|say-as|par|seq|media)[\s\S]*?>/gmi);
                let result;
                while ((result = findStartofTag.exec(thistext)) != null) {
                    startofTags.push(result[0]);
                    startofTagsName.push(result[1]);
                    startofTagsIndex.push(result.index);
                }
                if (startofTags.length > 0) {
                    if (thistext.search(findStartofTag) != -1) {
                        for (let j = startofTags.length - 1; j >= 0; j--) {
                            if (thistext.indexOf("</" + startofTagsName[j] + ">", startofTagsIndex[j]) != -1)  //This tag is closed.
                            {
                                startofTagsName.splice(j, 1);
                                startofTags.splice(j, 1);
                                startofTagsIndex.splice(j, 1);
                            }
                        }
                        for (let j = startofTags.length - 1; j >= 0; j--) {
                            let tmpStr = thistext.indexOf("<" + startofTagsName[j]) == -1 ? thistext : thistext.substring(0, thistext.indexOf("<" + startofTagsName[j]));
                            if (tmpStr.indexOf("</" + startofTagsName[j] + ">") != -1 && tmpStr.indexOf(startofTags[j]) == -1) { //Found the close tag of a tag started in prev para.
                                thistext = startofTags[j] + thistext;
                                startofTagsName.splice(j, 1);
                                startofTags.splice(j, 1);
                                startofTagsIndex.splice(j, 1);
                                continue;
                            }
                            if (thistext.indexOf("</" + startofTagsName[j] + ">", startofTagsIndex[j]) == -1) {  //This tag is not closed. Add a temporal close tag.
                                thistext += "</" + startofTagsName[j] + ">";
                            }
                        }

                    } else { //No start of tags found in this para
                        if (thistext.search(/<\/[\S]*?>/) != -1) {
                            for (let j = startofTags.length - 1; j >= 0; j--) {
                                if (thistext.indexOf("</" + startofTagsName[j] + ">") != -1) {
                                    thistext = startofTags[j] + thistext;
                                    startofTagsName.splice(j, 1);
                                    startofTags.splice(j, 1);
                                    startofTagsIndex.splice(j, 1);
                                }
                            }
                        } else {
                            if (startofTags.length > 0) {
                                for (let j = startofTags.length - 1; j >= 0; j--) {
                                    thistext = startofTags[j] + thistext + "</" + startofTagsName[j] + ">";
                                }
                            }
                        }
                    }
                }
            }
            thisjson.input.ssml = "<speak>" + thistext + "</speak>";
            jsonQueue[i] = JSON.stringify(thisjson);
        }
    }

    for (let i = 0; i < jsonQueue.length; i++) {
        if (jsonQueue[i].indexOf("ssml") != -1) {
            let thisjson = JSON.parse(jsonQueue[i]);
            let thistext = thisjson.input.ssml;
            thistext = (/<speak>([\s\S]+)<\/speak>/.exec(thistext))[1];
            let emptyTags = new RegExp(/<(prosody|sub|phoneme|say-as|par|seq|media)[^>]*?>[\s]*?<\/[\S]*?>/gmi);
            if (emptyTags.exec(thistext) != null) {
                thistext = thistext.replace(emptyTags, "");
            }
            if (thistext.trim() == "") {
                jsonQueue.splice(i, 1);
                continue;
            } else {
                thisjson.input.ssml = "<speak>" + thistext + "</speak>";
                jsonQueue[i] = JSON.stringify(thisjson);
            }
        }

    }

    for (let i = 0; i < jsonQueue.length; i++) {
        if (jsonQueue[i].indexOf("ssml") != -1) {
            let thisjson = JSON.parse(jsonQueue[i]);
            let thistext = thisjson.input.ssml;
            if (jsonQueue[i + 1] != undefined) {
                if (JSON.parse(jsonQueue[i + 1]).break == undefined) {
                    thisjson.input.ssml = thistext.replace("</speak>", "<break strength='medium'/></speak>");
                    jsonQueue[i] = JSON.stringify(thisjson);
                }
            }
        }
    }

    for (let i = 0; i < jsonQueue.length; i++) {
        let thisjson = JSON.parse(jsonQueue[i]);
        if (thisjson.break != undefined) {
            if (jsonQueue[i + 1] != undefined) {
                let nextjson = JSON.parse(jsonQueue[i + 1]);
                if (nextjson.break != undefined) {
                    thisjson.break = Number(thisjson.break) + Number(nextjson.break);
                    jsonQueue[i] = JSON.stringify(thisjson);
                    jsonQueue.splice(i + 1, 1);
                    i--;
                }
            }
        }
    }

    for (let i = 0; i < jsonQueue.length; i++) {  //Rewrite JSON to reuse audio
        if (jsonQueue[i].indexOf("ssml") != -1) {
            for (let j = 0; j < jsonQueue.length; j++) {
                if (jsonQueue[i] == jsonQueue[j] && i > j) {
                    jsonQueue[i] = "{ \"repeatLine\" : \"" + j + "\" }";
                }
            }
        }
    }


    console.log("jsonQueue optimized. Now JSON queue looks like: " + jsonQueue);
}

async function sendReq() {
    if (jsonQueue.length > 0) {
        console.log("Sending requests to the server.");
        for (let i = 0; i < jsonQueue.length; i++) {
            if (audioQueue[i] == undefined || audioQueue[i] == "") {
                let thisjson = JSON.parse(jsonQueue[i]);
                console.log("Requesting line " + i + "...");
                if (thisjson.audio != undefined) {
                    console.log("Loading external audio file: " + thisjson.audio);
                    await fetch(thisjson.audio).then(res => {
                        if (res.ok) {
                            return res.blob();
                        } else {
                            throw new Error(res.statusText);
                        }
                    }).then(resblob => {
                        if (resblob != undefined) {
                            console.log("Audio #" + i + " received.");
                            if (jsonQueue[i] != undefined) audioQueue[i] = URL.createObjectURL(resblob);
                        }
                    }).catch(reason => {
                        console.log("Unable to load audio file: " + thisjson.audio + ", " + reason);
                    });
                } else if (thisjson.audioid != undefined) {
                    let targetAudio = staticAudio[Number(thisjson.audioid)];
                    if (targetAudio == undefined) {
                        console.log("staticAudio #" + thisjson.audioid + " does not exist. Skipping.");
                        audioQueue[i] = "";
                    } else {
                        console.log("Loading staticAudio #" + thisjson.audioid);
                        audioQueue[i] = targetAudio;
                    }
                } else if (thisjson.repeatLine != undefined) { //Reuse audio for same content
                    audioQueue[i] = audioQueue[Number(thisjson.repeatLine)];
                    console.log("Loading audio #" + thisjson.repeatLine + " for JSON #" + i);
                } else if (thisjson.break != undefined) {
                    audioQueue[i] = generateBlank(thisjson.break);
                    console.log("Generated blank of " + thisjson.break + "s.");
                } else {
                    let retryTimes = 3;
                    let index;
                    for (index = 0; index < retryTimes; index++) {
                        await fetch(serverPrefix + 'speak.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: jsonQueue[i]
                        }).then(res => {
                            if (res.ok) {
                                return res.text();
                            } else {
                                index = 90;
                                throw new Error(res.statusText);
                            }
                        }).then(restext => {
                            if (restext.indexOf("data:audio") != -1 && restext != "data:audio/" + thisjson.audioConfig.audioEncoding.toLowerCase() + ";base64,") {
                                console.log("Audio #" + i + " received.");
                                if (jsonQueue[i] != undefined) audioQueue[i] = restext;
                                index = 99;
                            }
                        }).catch(reason => {
                            console.log("Failed to retrieve audio #" + i + ": " + reason + ".");
                            if (index != 90 && index < retryTimes - 1) console.log("Retrying...");
                        });
                        await sleep(3000);
                    }
                    if (index < 99) {
                        console.error("Failed to retrieve audio #" + i);
                    }
                }
            }
        }

        let verifyCount = 0;
        audioQueue.forEach(() => {
            verifyCount++;
        });
        if (verifyCount < jsonQueue.length) {
            msgbox("Some lines are not synthesized correctly.");
        } else {
            if (audioQueue.length <= 0 || jsonQueue.length <= 0) {
                console.log("Operation aborted.");
                changeSubButton("Speak it!", true);
                audioQueue = [];
            } else {
                console.log("All audio has been retrieved.");
                $("#saveit").removeAttr("disabled");  //saveit button state change
            }
        }
    } else {
        msgbox("Type in something first!");
    }
}

async function getVoices() {
    console.log("Requesting voice list...");
    let voiceList;
    await fetch(serverPrefix + 'list_voices.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => {
        if (!res.ok) {
            throw new Error('HTTP error, status = ' + res.status);
        } else {
            return res.json();
        }
    }).then(resjson => {
        console.log("Voice list received: " + resjson);
        voiceList = resjson;

    }).catch(reason => msgbox("An error occured when retrieving the voice list: \n" + reason));
    return voiceList;
}

async function joinAudio() {
    var ttlLength = 0;
    var sr;
    var abQueue = [];

    if (audioQueue.length <= 0) {
        msgbox("Speak it at least once first!");
        reject("No audio received yet.");
    } else {
        console.log("Begin Join Audio -->");
        for (let i = 0; i < audioQueue.length; i++) {
            console.log("Process Audio #" + i);
            await fetch(audioQueue[i]).then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP error, status = ' + response.status);
                } else {
                    return response.arrayBuffer();
                }
            }).then(async function (response) {
                await audioCtx.decodeAudioData(response).then(function (buffer) {
                    var b = buffer.getChannelData(0);
                    //console.log (b.numberOfChannels);
                    abQueue.push(b);
                    ttlLength += b.length;
                    sr = buffer.sampleRate;
                });

            });

        }
        console.log("Total length: " + ttlLength);
        let resultBuffer = audioCtx.createBuffer(1, ttlLength, sr);
        let rbData = resultBuffer.getChannelData(0);

        var j = 0;
        for (let i = 0; i < abQueue.length; i++) {
            await rbData.set(abQueue[i], j);
            j += abQueue[i].length;
        }

        console.log("<-- End of Join Audio");

        return resultBuffer;
    }
}

function downloadFile(dl, filename) {
    let a = document.createElement('a');
    a.download = (filename == undefined ? new Date().getTime().toString() : filename) + '.wav';
    a.href = dl;
    $("body").append(a);
    a.click();
    $(a).remove();
}

async function saveAudio(filename) {
    if (audioQueue.length <= 0) {
        msgbox("Speak it at least once first!");
    } else {
        try {
            await joinAudio().then(function (b) {
                console.log(b);

                let wav = audioBufferToWav(b);
                var blob = new Blob([new DataView(wav)], {
                    type: "audio/wav"
                });
                console.log(blob);
                console.log("Triggering download...");
                let dl = window.URL.createObjectURL(blob);
                downloadFile(dl, filename);
                URL.revokeObjectURL(dl);
            });
        } catch (error) {
            msgbox("An error occured when exporting the audio: \n" + error);
        }
    }
}

function generateBlank(length) {
    let buffer = audioCtx.createBuffer(1, Number(length) * 22050, 22050);
    let wav = audioBufferToWav(buffer);
    let blob = new Blob([new DataView(wav)], {
        type: "audio/wav"
    });
    return window.URL.createObjectURL(blob);
}

function recycleQueues() {
    if (audioQueue.length > 0) {
        audioQueue.forEach((v, i) => {
            if (v != "") {
                audioRecycled.push(v);
                jsonRecycled.push(jsonQueue[i]);
            }
        });
        audioQueue = [];
        jsonQueue = [];
    }
}

function reuseAudio(clear) {
    if (jsonRecycled.length > 0) {
        for (let index = 0; index < jsonQueue.length; index++) {
            const element = jsonQueue[index];
            if (audioQueue[index] == undefined) {
                for (let j = 0; j < jsonRecycled.length; j++) {
                    const elem = jsonRecycled[j];
                    if (elem == element) {
                        audioQueue[index] = audioRecycled[j];
                        console.log("Loading recycled Audio #" + j + " for Audio #" + index);
                    }
                }
            }

        }
    }
    if (clear == undefined) {
        audioRecycled = [];
        jsonRecycled = [];
    }
}