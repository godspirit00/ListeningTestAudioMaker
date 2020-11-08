<?php

/**
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * For instructions on how to run the samples:
 *
 * @see https://github.com/GoogleCloudPlatform/php-docs-samples/tree/master/texttospeech/README.md
 */

// Include Google Cloud dependendencies using Composer
require_once __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/config.php';

// [START tts_synthesize_ssml]
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
// use Google\Cloud\TextToSpeech\V1\SsmlVoiceGender;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;


$data = file_get_contents("php://input");
$json = json_decode($data, true);
$base64_file = "";

if (array_key_exists("input", $json)) {
    // create client object
    $client = new TextToSpeechClient(['credentials' => KEYFILE]);

    $input_text = (new SynthesisInput())
        ->setSsml($json["input"]["ssml"]);

    $langCode = strstr($json["voice"]["name"], "-Wavenet", true);
    if (!$langCode) {
        $langCode = strstr($json["voice"]["name"], "-Standard", true);
    }
    // note: the voice can also be specified by name
    // names of voices can be retrieved with $client->listVoices()
    $voice = (new VoiceSelectionParams())
        ->setName($json["voice"]["name"])
        ->setLanguageCode($langCode);

    $audioConfig = (new AudioConfig())
        ->setAudioEncoding(AudioEncoding::OGG_OPUS)
        ->setSpeakingRate(floatval($json["audioConfig"]["speakingRate"]));

    $response = $client->synthesizeSpeech($input_text, $voice, $audioConfig);
    $audioContent = $response->getAudioContent();

    $base64_data = base64_encode($audioContent);
    $base64_file = "data:audio/ogg;base64," . $base64_data;


    $client->close();
    // [END tts_synthesize_ssml]
}

echo ($base64_file);
