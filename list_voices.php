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

// [START tts_list_voices]
use Google\Cloud\TextToSpeech\V1\TextToSpeechClient;

$json='{"voices":[';

// create client object
$client = new TextToSpeechClient(['credentials'=>KEYFILE]);
// perform list voices request
// List Chinese voices
$response = $client->listVoices(['languageCode'=>'zh']);
$voices = $response->getVoices();

foreach ($voices as $voice) {
    $json.='{ "name":"'.$voice->getName().'","lang":"'.$voice->getLanguageCodes()[0].'","gender":"'.$voice->getSsmlGender().'"},';
}

// List English voices
$response = $client->listVoices(['languageCode'=>'en-US']);
$voices = $response->getVoices();

foreach ($voices as $voice) {
    $json.='{ "name":"'.$voice->getName().'","lang":"'.$voice->getLanguageCodes()[0].'","gender":"'.$voice->getSsmlGender().'"},';
}

$json=chop($json,",").']}';
echo $json;


$client->close();
// [END tts_list_voices]
?>