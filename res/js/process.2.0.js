var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const serverPrefix = "";  //Always ends it with a "/"
const ssml_gender = ["NEUTRAL", "MALE", "FEMALE"]

function sleep(interval) {
    return new Promise(resolve => {
        setTimeout(resolve, interval);
    })
}

function downloadFile(dl, filename) {
    let a = document.createElement('a');
    a.download = (filename == undefined ? new Date().getTime().toString() : filename) + '.wav';
    a.href = dl;
    $("body").append(a);
    a.click();
    $(a).remove();
}


String.prototype.format = function (args) {
    var result = this;
    if (arguments.length < 1) {
        return result;
    }
    var data = arguments;
    if (arguments.length == 1 && typeof (args) == "object") {
        data = args;
        for (var key in data) {
            var value = data[key];
            if (undefined != value) {
                result = result.replaceAll("{" + key + "}", value);
            }
        }
    } else if (arguments.length > 1 || (arguments.length == 1 && typeof (args) != "object")) {
        for (let i = 0; i < arguments.length; i++) {
            result = result.replaceAll("{" + i + "}", arguments[i]);
        }
    }
    return result;
}

String.prototype.splice = function (start, newStr) {
    return this.slice(0, start) + newStr + this.slice(start);
}

String.prototype.replaceAt = function (start, end, newStr) {
    return this.slice(0, start) + newStr + this.slice(end);
}

const setvoiceSpeed = '<voice name = "{0}" rate="{1}">{2}</voice>';
const setpause = "<break time='{0}s'></break>";
const setaudio = '<audio id="{0}"></audio>';

class ClipManager {
    jsonQueue = [];  //json objects, NOT json strings
    audioQueue = [];  //anything string that points to an audio: datauri, bloburi, url
    staticAudio = [];  //{audio: same as above, name: optional, sth that describes the audio}
    status = -1;  //-1: idle, >=0: preparing audio #?
    constructor() {

    }
    addClip(json, audio) {
        for (let i = 0; i < this.jsonQueue.length; i++) {
            if (JSON.stringify(json) == JSON.stringify(this.jsonQueue[i])) {
                return i;
            }
        }
        let id = this.jsonQueue.push(json) - 1;
        if (audio != undefined) {
            this.audioQueue[id] = audio;
        }
        return id;
    }
    addClips(jsons) {
        if (jsons instanceof Array) {
            let ids = [];
            jsons.forEach((v) => {
                ids.push(this.addClip(v));
            });
            return ids;
        } else {
            return [this.addClip(jsons)];
        }
    }
    addAudioFile(audio, name) {
        if (audio != undefined) {
            for (let i = 0; i < this.staticAudio.length; i++) {
                if (this.staticAudio[i].audio == audio) {
                    return i;
                }
            }
            return this.staticAudio.push({ "audio": audio, "name": name }) - 1;
        }
    }
    makeJSON(text) {        //input text should always be xml tags. i.e. <voice>...</voice>, <audio>, <break>, etc.
        let thisone = $("<xml>" + text + "</xml>");
        let json;
        if (thisone.find("audio").length > 0) {
            json = { "audioid": thisone.find("audio").attr("id") };
        } else if (thisone.find("break").length > 0) {
            let time = thisone.find("break").attr("time");
            let findSec = /([0-9.]+)(ms|s)/.exec(time);
            let sec = (findSec[2] == "ms" ? findSec[1] / 1000 : findSec[1]);
            json = { "break": sec };
        } else if (thisone.find("voice").length > 0) {
            json = { "text": thisone.find("voice").html(), "voice": thisone.find("voice").attr("name"), "rate": thisone.find("voice").attr("rate") };
            if (thisone.find("voice").attr("pitch") != undefined) json['pitch'] = thisone.find("voice").attr("pitch");
        }
        return json;
    }
    optimizeJSON() {

    }
    getAudio = async (id) => {
        if ((this.audioQueue[id] == "" && this.status > id) || (this.audioQueue[id] == undefined && this.status > id) || (this.jsonQueue[id] == undefined)) return false;
        while ((this.audioQueue[id] == "" && this.status == id) || (this.audioQueue[id] == undefined && this.status < id)) {
            console.log("CLIPMANAGER: Waiting for audio #{0} to get prepared.".format(id))
            await sleep(500);
        }
        if (String(this.audioQueue[id]).includes("audioid")) {        //staticAudio file
            let audioid = JSON.parse(this.audioQueue[id]);
            return this.staticAudio[Number(audioid.audioid)].audio;
        } else {
            return this.audioQueue[id];
        }
    }
    audioPrepared(id) {
        if (this.audioQueue[id] == "" || this.audioQueue[id] == undefined) {
            return false;
        } else {
            return true;
        }
    }
    prepareAudio = async (id) => {
        if (this.jsonQueue[id].break != undefined) {
            let buffer = audioCtx.createBuffer(1, Number(this.jsonQueue[id].break) * 8000, 8000);
            let wav = audioBufferToWav(buffer);
            let blob = new Blob([new DataView(wav)], {
                type: "audio/wav"
            });
            this.audioQueue[id] = window.URL.createObjectURL(blob);
            Promise.resolve();
        } else if (this.jsonQueue[id].audioid != undefined) {  //static audio file
            if (this.staticAudio[Number(this.jsonQueue[id].audioid)] == undefined) {
                console.error("The specified audio file #{0} doesn't exist.".format(this.jsonQueue[id].audioid))
                Promise.reject("The specified audio file #{0} doesn't exist.".format(this.jsonQueue[id].audioid));
            } else {
                this.audioQueue[id] = JSON.stringify(this.jsonQueue[id]);
                Promise.resolve();
            }
        } else if (this.jsonQueue[id].text != undefined) {   //unified json format for text synthesis: {"text":..., "voice":..., "rate":...}
            let thisjson = "{ \"input\": { \"ssml\" : \"<speak> " + this.jsonQueue[id].text.replaceAll("\n", " ") + " </speak>\" }, \"voice\": {\"name\": \"" +
                this.jsonQueue[id].voice + "\"}, \"audioConfig\":{\"audioEncoding\": \"OGG\", \"speakingRate\": " + this.jsonQueue[id].rate + (this.jsonQueue[id].pitch == undefined ? "" : ",\"pitch\":" + this.jsonQueue[id].pitch) + "} }";  //transform to gcloud tts format
            await fetch(serverPrefix + 'speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: thisjson
            }).then(res => {
                if (res.ok) {
                    return res.text();
                } else {
                    res.text().then(t=>{
                        throw new Error(t);
                    });
                }
            }).then(restext => {
                if (restext.length > 0) {
                    this.audioQueue[id] = "data:audio/" + JSON.parse(thisjson).audioConfig.audioEncoding.toLowerCase() + ";base64," + restext;
                    Promise.resolve();
                } else {
                    Promise.reject("Invalid audio received.");
                }
            }).catch(reason => {
                console.error("Failed to retrieve audio #" + id + ", " + reason + ".");
                Promise.reject("Failed to retrieve audio #" + id + ", " + reason + ".");
            });
        }
    }
    startPreparing = async () => {
        this.optimizeJSON();
        this.status = 0;
        for (let i = 0; i < this.jsonQueue.length; i++) {
            if (this.status == -1) break;
            if (this.audioQueue[i] != "" && this.audioQueue[i] != undefined) continue;
            console.log("CLIPMANAGER: Preparing audio #" + i);
            this.audioQueue[i] = ""

            let retryTimes = 1;
            let success = false;

            this.status = i;

            for (let trying = 0; trying < retryTimes; trying++) {
                await this.prepareAudio(i).then(() => {
                    success = true;
                }, () => {
                    console.log("Something went wrong when preparing audio #" + i);
                    console.log("Retrying...")
                });
                if (success) break;

                await sleep(3000);
            }
            if (!success) console.error("Failed to prepare audio #" + i);
            await sleep(3000);
        }
        this.status = -1; //return to idle
    }
    stopPreparing() {
        if (this.status != -1) {
            this.status = -1;
            for (let i = 0; i < this.jsonQueue.length; i++) {
                if (this.audioQueue[i] == undefined) {
                    this.jsonQueue.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

class Player {
    playlist = [];
    playerPointer = -1;
    cmObj;
    playerObj;
    statusText = "";
    issaving = false;
    constructor(cm) {
        this.cmObj = cm;
        let a = new Audio();
        a.autoplay = true;
        a.loop = false;
        a.addEventListener("playing", () => {
            this.statusText = "playing";
        });
        a.addEventListener("pause", () => {
            this.statusText = "pause";
        });
        a.addEventListener("ended", () => {
            if (this.playerPointer >= this.playlist.length - 1) {
                this.statusText = "finished";
            } else {
                this.play();
            }
        });

        this.playerObj = a;
    }
    play() {
        if (this.playerObj.paused && !this.playerObj.ended && this.playerPointer > -1) { this.playerObj.play(); return; }
        if (this.playerObj.ended && this.playerPointer >= this.playlist.length - 1) this.playerPointer = -1;  //has already finished playing once
        if (this.playerPointer < this.playlist.length) this.playerPointer++;
        this.statusText = "loading";
        console.log("PLAYER: Playing audio #" + this.playerPointer);
        this.cmObj.getAudio(this.playlist[this.playerPointer]).then((v) => {
            if (v) {
                this.playerObj.src = v;
                this.playerObj.play().then(() => {
                    this.statusText = "playing";
                });
            } else {
                console.log("PLAYER: Audio #{0} does not exist. Skipping...".format(this.playerPointer));
                this.play();
            }
        });
    }
    pause() {
        this.playerObj.pause();
    }
    save = async (filename) => {
        let audioQueue = [];
        this.issaving = true;
        for (let i = 0; i < this.playlist.length; i++) {
            await this.cmObj.getAudio(this.playlist[i]).then((v) => {
                if (v) {
                    audioQueue.push(v);
                }
            });
        }
        var ttlLength = 0;
        var sr;
        var abQueue = [];

        if (audioQueue.length <= 0) {
            return false;
        } else {
            try {
                console.log("Begin Join Audio -->");
                for (let i = 0; i < audioQueue.length; i++) {
                    console.log("Process Audio #" + i);
                    await fetch(audioQueue[i]).then(function (response) {
                        if (!response.ok) {
                            throw new Error('  Read error, status : ' + response.statusText);
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
                abQueue = null;

                console.log(resultBuffer);

                let wav = audioBufferToWav(resultBuffer);
                var blob = new Blob([new DataView(wav)], {
                    type: "audio/wav"
                });
                console.log(blob);
                console.log("Triggering download...");
                let dl = window.URL.createObjectURL(blob);
                downloadFile(dl, filename);
                URL.revokeObjectURL(dl);
                wav = null;
                blob = null;

                await sleep(3000);
                this.issaving = false;
            } catch (error) {
                console.error("Error when saving audio: " + error);
            }
        }

    }
    addToPlaylist(cmid) {
        if (cmid instanceof Array) {
            this.playlist.concat(cmid);
        } else {
            this.playlist.push(cmid);
        }
    }
    clearPlaylist() {
        this.playlist = [];
        this.statusText = "";
        this.playerPointer = -1;
        this.playerObj.pause();
    }
    get cansave() {
        let s = true;
        if (this.playlist.length <= 0) s = false;
        for (let i = 0; i < this.playlist.length; i++) {
            if (!this.cmObj.audioPrepared(this.playlist[i])) { s = false; break; }
        }
        return s;
    }
}

async function getVoices(lang) {
    console.log("Requesting voice list for {0}...".format(lang));
    let voiceList = [];
    await fetch(serverPrefix + 'list_voices/' + lang).then(res => {
        if (!res.ok) {
            res.text().then((t) => { throw new Error(t); });
        } else {
            return res.json();
        }
    }).then(resjson => {
        console.log("Voice list received: " + JSON.stringify(resjson));
        resjson.voices.forEach((v) => {
            if (v.name.includes("Wavenet")) voiceList.push(v);
        });

    }).catch(reason => console.error("An error occured when retrieving the voice list: \n" + reason));
    return (voiceList.length > 0 ? voiceList : false);
}
