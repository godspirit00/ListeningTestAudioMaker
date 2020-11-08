var paper = {
    "examTitle": "广西北部湾经济区初中学业水平测试。英语。听力测试。",
    "examEnding": "听力测试到此结束。",
    "questions": [{
        "ques": "（一）听句子，选图片。你将听到五个句子，请在下列六幅图中，选出与所听句子内容相符的图片。每个句子读一遍。",
        "rate": "0.77",
        "quesbreak1": "3",
        "quesbreak2": "5",
        "quesrepeat": "1",
        "quesbreak3": "0",
        "quesarttype": "1"
    }, {
        "ques": "（二）听句子，选答语。你将听到五个句子，请根据句子内容，选择恰当的答语。每个句子读两遍。",
        "rate": "0.79",
        "quesbreak1": "3",
        "quesbreak2": "5",
        "quesrepeat": "2",
        "quesbreak3": "3",
        "quesarttype": "1"
    }, {
        "ques": "（三）听对话，选择最佳答案。	你将听到三段对话，请根据对话内容，选出每个问题的最佳答案。每段对话读两遍。请听第一段对话，回答第 11至13 小题。",
        "rate": "0.77",
        "quesbreak1": "5",
        "quesbreak2": "8",
        "quesrepeat": "2",
        "quesbreak3": "7",
        "quesarttype": "2"
    }, {
        "ques": "请听第二段对话，回答第14至16 小题。",
        "rate": "0.77",
        "quesbreak1": "5",
        "quesbreak2": "8",
        "quesrepeat": "2",
        "quesbreak3": "7",
        "quesarttype": "2"
    }, {
        "ques": "请听第三段对话，回答第 17至20 小题。",
        "rate": "0.77",
        "quesbreak1": "5",
        "quesbreak2": "8",
        "quesrepeat": "2",
        "quesbreak3": "7",
        "quesarttype": "2"
    }, {
        "ques": "（四）听短文，选择最佳答案。你将听到一篇短文，请根据短文内容，选出每个问题的最佳答案。短文读两遍。",
        "rate": "0.75",
        "quesbreak1": "5",
        "quesbreak2": "8",
        "quesrepeat": "2",
        "quesbreak3": "5",
        "quesarttype": "3"
    }, {
        "ques": "（五）听短文，填信息。你将听到一篇短文，请根据短文内容，将所缺信息填入对应的横线上，每空一词。短文读两遍。",
        "rate": "0.75",
        "quesbreak1": "5",
        "quesbreak2": "8",
        "quesrepeat": "2",
        "quesbreak3": "6",
        "quesarttype": "3"
    }]
};

const serverPrefix2 = "";

function initForm() {
    for (let index = 1; index < paper.questions.length; index++) {
        $("#holder").after($("#template").clone());
    }
    $("#examTitle").val(paper.examTitle);
    $("#examEnding").val(paper.examEnding);
    for (let index = 0; index < paper.questions.length; index++) {
        const element = paper.questions[index];
        $($(".questions")[index]).find(".ques").val(element.ques);
        $($(".questions")[index]).find(".speed-ques").val(element.rate);
        $($(".questions")[index]).find(".ques-break1").val(element.quesbreak1);
        $($(".questions")[index]).find(".ques-break2").val(element.quesbreak2);
        $($(".questions")[index]).find(".ques-break3").val(element.quesbreak3);
        $($(".questions")[index]).find(".ques-repeat").val(element.quesrepeat);
        $($(".questions")[index]).find(".ques-art-type").val(element.quesarttype);
        $($(".questions")[index]).find(".voicegenders").attr("name", "usedvoice" + index);
        $($(".questions")[index]).attr("id", "ques" + index);
    }
    $(".usingvoice").each(function (i) {
        if (i % 2 === 0) { $(this).find(".usingVoiceEnMale").click(); } else { $(this).find(".usingVoiceEnFemale").click(); }
    });
    $(".usingvoice").each(function () {
        if ($(this).find("label.active").length > 1) {
            $(this).find(".voicegenders:checked").parent("label").siblings("label").toggleClass("active", false);
        }
    });
}

function makeText(JQObject) {
    let txt = "";
    let voicecn = $("#voice-cn").val();
    let speedcn = $("#speed-cn").val();
    let voiceEnMale = $("#voice-en-male").val();
    let voiceEnFemale = $("#voice-en-female").val();
    if (JQObject.find("#examTitle").length > 0) {
        txt = "<voice name='" + voicecn + "' rate='" + speedcn + "'>" + JQObject.find("#examTitle").val() + "</voice>";
    } else if (JQObject.find("#examEnding").length > 0) {
        txt = "<voice name='" + voicecn + "' rate='" + speedcn + "'>" + JQObject.find("#examEnding").val() + "</voice>";
    } else if (JQObject.hasClass("questions")) {
        let quesbreak1 = JQObject.find(".ques-break1").val();
        let quesbreak2 = JQObject.find(".ques-break2").val();
        let quesbreak3 = JQObject.find(".ques-break3").val();
        let quesrepeat = Number(JQObject.find(".ques-repeat").val());
        let quesrate = JQObject.find(".speed-ques").val();
        let quesarttype = JQObject.find(".ques-art-type").val();
        let quesart = JQObject.find(".ques-art").val();
        let voiceGender = JQObject.find(".voicegenders:checked").val();
        if (quesrepeat < 2) quesbreak3 = 0;

        txt += "<voice name='" + voicecn + "' rate='" + speedcn + "'>" + JQObject.find(".ques").val() + "</voice>";

        switch (quesarttype) {
            case "1":
                txt += "<voice name='" + (voiceGender == "1" ? voiceEnMale : voiceEnFemale) + "' rate='" + quesrate + "'>";
                let subques = quesart.split("\n");
                subques.forEach(element => {
                    if (element.trim() != "") {
                        txt += "<break time='" + quesbreak1 + "s' /><audio id=\"0\"/>";
                        if (quesrepeat > 1) {
                            txt += "<repeat count='" + quesrepeat + "'>" + element + "<break time='" + quesbreak3 + "s' /></repeat>";
                        } else {
                            txt += element;
                        }
                        txt += "<break time='" + (quesbreak2 - quesbreak3) + "s' />";
                    }
                });
                txt += "</voice>";
                break;
            case "2":
                txt += "<break time='" + quesbreak1 + "s' /><audio id=\"0\"/>";
                let lines = quesart.split("\n");
                for (let index = 0; index < lines.length; index++) {
                    const element = lines[index];
                    if (element.trim() == "") continue;
                    let curCharPos = element.search(/(:|：)/);
                    if (curCharPos == -1) {
                        if (index <= 0) {
                            return false;
                        } else {
                            lines[index - 1] = lines[index - 1].replace("</voice>", " " + lines[index] + "</voice>");
                            lines.splice(index, 1);
                            index--;
                        }
                    } else {
                        let curChar = element.substring(0, curCharPos);
                        if (curChar.toLowerCase() == "m" || curChar.toLowerCase() == "man" || curChar.toLowerCase() == "boy") {
                            lines[index] = lines[index].replace(curChar, "<voice name='" + voiceEnMale + "' rate='" + quesrate + "'>");
                        } else if (curChar.toLowerCase() == "w" || curChar.toLowerCase() == "woman" || curChar.toLowerCase() == "girl") {
                            lines[index] = lines[index].replace(curChar, "<voice name='" + voiceEnFemale + "' rate='" + quesrate + "'>");
                        } else {
                            lines[index] = lines[index].replace(curChar, "<voice name='" + voiceEnMale + "' rate='" + quesrate + "'>");
                        }
                        lines[index] += "</voice>";
                        lines[index] = lines[index].replace(/('>)(:|：)/, "$1");
                    }
                }
                if (quesrepeat > 1) {
                    txt += "<repeat count='" + quesrepeat + "'>" + lines.join("\n") + "<break time='" + quesbreak3 + "s' /></repeat>";
                } else {
                    txt += lines.join("\n");
                }
                txt += "<break time='" + (quesbreak2 - quesbreak3) + "s' />";
                break;
            case "3":
                txt += "<break time='" + quesbreak1 + "s' /><audio id=\"0\"/>";
                txt += "<voice name='" + (voiceGender == "1" ? voiceEnMale : voiceEnFemale) + "' rate='" + quesrate + "'>";
                if (quesrepeat > 1) {
                    txt += "<repeat count='" + quesrepeat + "'>" + quesart + "<break time='" + quesbreak3 + "s' /></repeat>";
                } else {
                    txt += quesart;
                }
                txt += "</voice>";
                txt += "<break time='" + (quesbreak2 - quesbreak3) + "s' />";
                break;
            default:
                break;
        }
    }
    return txt;
}

function changeSubButton(text, state) {
    if (text != "") $("#sub").html(text);
    if (state != undefined) {
        if (state) {
            $("#sub").removeAttr("disabled");
        } else {
            $("#sub").attr("disabled", "true");
        }
    }
}

function msgbox(body, title) {
    title != undefined ? $("#msgboxTitle").text(title) : $("#msgboxTitle").text("Attention");
    $("#msgboxBody").html(body);
    $("#msgbox").modal("show");
}

function disableAll(bool) {
    if (bool) {
        $("#mainform").find("input").attr("disabled", "true");
        $("#mainform").find("select").attr("disabled", "true");
        $("#mainform").find(".playthis").attr("disabled", "true");
        $("#mainform").find(".ques-art").attr("disabled", "true");
    } else {
        $("#mainform").find("input").removeAttr("disabled");
        $("#mainform").find("select").removeAttr("disabled");
        $("#mainform").find(".playthis").removeAttr("disabled");
        $("#mainform").find(".ques-art").removeAttr("disabled");
    }
}

const player = new Audio();
player.loop = false;


$(document).on("change input", ".range",
    function () { //bind the change/input event of range on document so that later generated ranges can also have the event.
        $(this).next(".rangetxt").val($(this).val());
    });
$(document).on("change input", ".rangetxt", function () {
    $(this).prev(".range").val($(this).val());
});
$(document).on("change input", ".ques-repeat", function () {
    $(this).parent().next("div").toggleClass("d-none", ($(this).val() <= 1));
});
$(document).on("change input", ".ques-art-type", function () {
    let ph = "";
    let uv = true;
    switch ($(this).val()) {
        case "1":
            ph = "请输入听力原文。一行一个小题。";
            break;
        case "2":
            ph = "请输入听力原文，并在每行的开头以“M: ”标注英文男声所说内容，以“W: ”标注英文女声所说内容。请注意使用“: ”分隔说话人和说话内容。";
            uv = false;
            break;
        case "3":
            ph = "请输入听力原文。";
            break;
        default:
            ph = "请输入听力原文。";
            break;
    }
    $(this).parents(".form-group").next(".form-group").find(".ques-art").attr("placeholder", ph);
    $(this).parents(".form-group").find(".usingvoice").toggleClass("d-none", !uv);
});
$(document).ready(function () {
    initForm();

    $("form").submit(event => event.preventDefault());
    $(".range").change();
    $(".ques-repeat").change();
    $(".ques-art-type").change();

    $("#saveit").attr("disabled", "true");  //saveit button state change
    changeSubButton('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;请稍候…', false);

    getVoices().then(resjson => {
        if (resjson != undefined) {
            let ssmlVoiceGender = ['SSML_VOICE_GENDER_UNSPECIFIED', '👨', '👩', 'NEUTRAL'];

            for (const key in resjson.voices) {
                if (resjson.voices.hasOwnProperty(key)) {
                    const element = resjson.voices[key];
                    if (element.lang.includes("cmn-CN") && element.name.includes("Wavenet")) {
                        $("#voice-cn").append("<option value='" + element.name + "'>" + ssmlVoiceGender[Number(element.gender)] + " " + element.name.replace("cmn-CN-Wavenet-", "") + " </option>");
                    } else if (element.lang.includes("en") && element.name.includes("Wavenet")) {
                        if (element.gender == "1") {
                            $("#voice-en-male").append("<option value='" + element.name + "'>" + element.name.replace(/en-(US|GB|AU|IN)-Wavenet-([A-Z]+)/gmi, "($1) $2") + " </option>");
                        } else if (element.gender == "2") {
                            $("#voice-en-female").append("<option value='" + element.name + "'>" + element.name.replace(/en-(US|GB|AU|IN)-Wavenet-([A-Z]+)/gmi, "($1) $2") + " </option>");
                        }
                    }
                }
            }
            $("#voice-cn > option:nth-child(3)").attr("selected", "true");
            $("#voice-en-male > option:nth-child(9)").attr("selected", "true");
            $("#voice-en-female > option:nth-child(9)").attr("selected", "true");

            $("#voice").val($("#voice-cn > option:nth-child(3)").val());

            changeSubButton("播放", true);

            $("#mainframe").toggleClass("d-none", false);
            $("#loading").toggleClass("d-none", true);
        }
    });


    fetch(serverPrefix2 + "audio/dingdong.ogg").then(res => {
        if (res.ok) {
            return res.blob();
        } else {
            throw new Error(res.statusText);
        }
    }).then(resblob => {
        if (resblob != undefined) {
            console.log("A preset audio 'dingdong' is received.");
            staticAudio.push(URL.createObjectURL(resblob));
        }
    }).catch(reason => {
        console.log("Unable to load the preset audio: dingdong.ogg, " + reason + "\nSkipping.");
        staticAudio.push("");
    });

    player.addEventListener("ended", () => {
        if (playerPointer >= audioQueue.length - 1 || audioQueue[playerPointer + 1] == undefined) {
            if (audioQueue.length > 0) {
                if (playerPointer < jsonQueue.length - 1) {
                    changeSubButton('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;请稍候…', false);
                    disableAll(true);
                } else {
                    changeSubButton("重放", true);
                    disableAll(false);
                }
            } else {
                changeSubButton("播放", true);
                disableAll(false);
            }
        }
    });

    var docWatch = setInterval(function () {
        if (audioQueue.length > 0 && audioQueue[playerPointer + 1] != undefined) //To make the audio start playing, audioQueue has to have sth, and playerPointer is -1.
        {
            if (player.ended || (!player.ended && playerPointer == -1)) {
                playerPointer++;
                if (audioQueue[playerPointer] != "") {
                    player.src = audioQueue[playerPointer];
                    console.log("Playing Audio #" + playerPointer);
                    player.play();
                } else {
                    console.log("Audio #" + playerPointer + " is empty, skipping.");
                }

                changeSubButton("暂停", true);
                disableAll(true);
            }
        }

    }, 100);

});


$("#trial-en-male").click(() => {
    let p = $("#tem")[0];
    if (!p.ended && !p.paused) {
        p.pause();
    } else {
        p.src = serverPrefix2 + "audio/" + $("#voice-en-male").val().replace(/en-(US|GB|AU|IN)-Wavenet-([A-Z]+)/gmi, "$1$2-demo.mp3").toLowerCase();
        $("#tef")[0].pause();
        p.play();
    }
});
$("#trial-en-female").click(() => {
    let p = $("#tef")[0];
    if (!p.ended && !p.paused) {
        p.pause();
    } else {
        p.src = serverPrefix2 + "audio/" + $("#voice-en-female").val().replace(/en-(US|GB|AU|IN)-Wavenet-([A-Z]+)/gmi, "$1$2-demo.mp3").toLowerCase();
        $("#tem")[0].pause();
        p.play();
    }
});
function trialSpinner(target, bool) //target should be trial button
{
    $(target).find("span").toggleClass("d-none", !bool);
    $(target).toggleClass("btn-outline-info", bool);
    $(target).toggleClass("btn-info", !bool);
}

$("#tem")[0].addEventListener("waiting", () => {
    trialSpinner("#trial-en-male", true);
});
$("#tem")[0].addEventListener("playing", () => {
    trialSpinner("#trial-en-male", false);
});
$("#tef")[0].addEventListener("waiting", () => {
    trialSpinner("#trial-en-female", true);
});
$("#tef")[0].addEventListener("playing", () => {
    trialSpinner("#trial-en-female", false);
});
$(document).on("change input", "#voice-en-male", function () {
    trialSpinner("#trial-en-male", false);
});
$(document).on("change input", "#voice-en-female", function () {
    trialSpinner("#trial-en-female", false);
});


$("#reset").click(() => {
    initForm();
    $(".ques-art").val("");
    thingsChange();
});


$("#sub").click(() => {
    if (audioQueue.length <= 0) {
        changeSubButton('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;请稍候…', false);
        disableAll(true);

        let txt = "";
        if ($("#examTitle").val().trim() != "") txt += makeText($("#title")) + "<break strength='strong'/>";
        $(".questions").each(function () {
            let quesID = Number($(this).attr("id").replace("ques", ""));
            if ($(this).find(".ques-art").val().trim() == "" || $(this).find(".ques").val().trim() == "") {
                console.log("Question #" + quesID + " is empty in either question or transcription. Igoring.");
            } else {
                let thistxt = makeText($(this));
                if (thistxt != false) {
                    txt += thistxt;
                } else {
                    console.log("Question #" + quesID + " is mal-formatted. Ignoring.");
                }
            }
        });
        if ($("#examEnding").val().trim() != "") txt += makeText($("#ending"));
        console.log("Text generated. \n" + txt);
        $("#t").val(txt);

        if ($("#t").val().length <= 0) {
            msgbox("内容为空。", "错误");
            changeSubButton("播放", true);
            disableAll(false);
            return;
        }

        process();
        optimizeJSON();
        reuseAudio();
        sendReq();
    } else {
        if (player.ended && playerPointer >= audioQueue.length - 1) {
            console.log("Audio already retrieved. Start playing.");
            playerPointer = -1;
            // Play audioQueue directly.
            changeSubButton("暂停", true);
            disableAll(true);
        } else {
            if (!player.ended && player.paused) {
                player.play();
                changeSubButton("暂停", true);
                disableAll(true);
            } else if (!player.ended && !player.paused) {
                player.pause();
                changeSubButton("继续", true);
                disableAll(false);
            }
        }
    }
});

function thingsChange() {
    recycleQueues();
    playerPointer = -1;
    changeSubButton("播放", true);
    $("#saveit").attr("disabled", "true");  //saveit button state change
}

$(document).on("change input", "input", () => thingsChange());
$(document).on("change input", "select", () => thingsChange());
$(document).on("change input", ".ques-art", () => thingsChange());


$("#inputfilenamedlg").on("shown.bs.modal", () => {
    let t = $("#filename");
    t.val($("#examTitle").val().trim() == "" ? new Date().getTime().toString() : $("#examTitle").val().replace(/，。：？！\\\/\,\.\n\^\?!\s/gmi, "_"));
    t.focus();
    t.select();
});
$("#dlgok9").click(() => {
    let filename = $("#filename").val();
    $("#saveit").attr("disabled", "true");  //saveit button state change
    $("#saveit").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;Please wait...');
    saveAudio(filename).then(() => {
        $("#saveit").removeAttr("disabled");  //saveit button state change
        $("#saveit").html("保存音频");
    });
});
$("#inputfilenamedlg").find("#filename").keypress((event) => {
    if (event.which == 13) {
        event.preventDefault();
        $("#dlgok9").click();
    }
});
$("#inputfilenamedlg").find("#filename").on("input change", () => {
    if ($("#inputfilenamedlg").find("#filename").val() == "") {
        $("#dlgok9").attr("disabled", "true");
    } else {
        $("#dlgok9").removeAttr("disabled");
    }
});
