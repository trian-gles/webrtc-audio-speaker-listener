/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const callButton = document.querySelector('button#callButton');
const hangupButton = document.querySelector('button#hangupButton');

hangupButton.disabled = true;
//callButton.onclick = call;
//hangupButton.onclick = hangup;

const audioInputSelect = document.querySelector('select#audioSource');

let hasMic = false;
let openMic = undefined;
let hasPermission = false;


function getDevices() {
  navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
}

function gotDevices(deviceInfos) {
  console.log('gotDevices', deviceInfos);
  hasMic = false;
  hasPermission = false;
  let value = audioInputSelect.value;
  // Handles being called several times to update labels. Preserve values.

    while (audioInputSelect.firstChild) {
        audioInputSelect.removeChild(audioInputSelect.firstChild);
    }
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.deviceId == '') {
      continue;
    }
    // If we get at least one deviceId, that means user has granted user
    // media permissions.
    hasPermission = true;
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      hasMic = true;
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
    if (Array.prototype.slice.call(audioInputSelect.childNodes).some(n => n.value === value)) {
        audioInputSelect.value = value;
    }
  start();
}


function gotStream(stream) {
  window.stream = stream; // make stream available to console
  if (stream.getAudioTracks()[0]) {
    openMic = stream.getAudioTracks()[0].getSettings().deviceId;
  }
  // Refresh list in case labels have become available
  return getDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  const audioSource = audioInputSelect.value || undefined;
  // Don't open the same devices again.
  if (hasPermission && openMic == audioSource) {
    return;
  }
  // Close existng streams.
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
    openMic = undefined;
  }
  const constraints = {
    audio: true,
    video: false
  };
  if (hasMic) {
    constraints['audio'] = {deviceId: audioSource ? {exact: audioSource} : undefined};
  }
  console.log('start', constraints);
  if (!hasPermission || hasMic) {
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
  }
}

audioInputSelect.onchange = start;
navigator.mediaDevices.ondevicechange = getDevices;

getDevices();