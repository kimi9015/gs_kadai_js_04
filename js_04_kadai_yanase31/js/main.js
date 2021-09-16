// Initialize Firebase
var firebaseConfig = {
    apiKey: "",
    authDomain: "web-mtg-speech-recognition.firebaseapp.com",
    databaseURL: "https://web-mtg-speech-recognition-default-rtdb.firebaseio.com/",
    projectId: "web-mtg-speech-recognition",
    storageBucket: "web-mtg-speech-recognition.appspot.com",
    messagingSenderId: "398231502656",
    appId: "1:398231502656:web:6efd3207c42e1268b984a5"
  };
  
  
  firebase.initializeApp(firebaseConfig); 

  
  //Msg送信準備
  const newPostRef = firebase.database();
  
  let room = "room1";
  
  const username = document.getElementById("username");
  const output = document.getElementById("output")
  
  
  //Msg受信処理
  function text(){
    newPostRef.ref(room).on("child_added", function (data) {
      const v = data.val();
      const k = data.key;
      let str = "";
    
      str += '<div id="' + k + '" class="msg_main">'
      str += '<div class="msg_left">';
      str += '<div class=""><img src="img/icon_person.png" alt="" class="icon ' + v.username +
        '" width="30"></div>';
      str += '<div class="msg">';
      str += '<div class="name">' + v.username + '</div>';
      str += '<div class="text">' + v.text + '</div>';
      str += '</div>';
      str += '</div>';
      str += '<div class="msg_right">';
      str += '<div class="time">' + v.time + '</div>';
      str += '</div>';
      str += '</div>';
    
      output.innerHTML += str;
  
      //--------------- 自動スクロール機能を追加 ---------------//
      $("#output").scrollTop( $("#output")[0].scrollHeight );
    
    });
  
  }
  
  //時間を取得する関数
  function time() {
    var date = new Date();
    var hh = ("0" + date.getHours()).slice(-2);
    var min = ("0" + date.getMinutes()).slice(-2);
    var sec = ("0" + date.getSeconds()).slice(-2);
  
    var time = hh + ":" + min + ":" + sec;
    return time;
  }
  
  //音声認識処理
  const speech = new webkitSpeechRecognition();
  speech.lang = 'ja-JP';
  
  const join = document.getElementById('join');
  const content = document.getElementById('content');
  
  join.addEventListener('click', function () {

      room = document.getElementById('join-room').value;
      
      speech.start();

      text();
  });
  
  //--------------- endcall ---------------//
  const endcall = document.getElementById('end-call');
  endcall.addEventListener('click', function(){
    location.reload();
  })
  
  speech.onresult = function (e) {
      speech.stop();
      if (e.results[0].isFinal) {
        var autotext = e.results[0][0].transcript
        console.log(e);
        console.log(autotext);
  
        newPostRef.ref(room).push({
          username: username.value,
          text: autotext,
          time: time()
        });
        
      }
  }
  
  speech.onend = () => {
      speech.start()
  };
  

// Skyway js SDK

/* eslint-disable require-jsdoc */
$(function() {
    // Peer object
    const peer = new Peer({
      // key:   window.__SKYWAY_KEY__,
      key:   "",
      debug: 3,
    });
  
    let localStream;
    let room;
    peer.on('open', () => {
      $('#my-id').text(peer.id);
      // Get things started
      step1();
    });
  
    peer.on('error', err => {
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
    });
  
    $('#make-call').on('submit', e => {
      e.preventDefault();
      // Initiate a call!
      const roomName = $('#join-room').val();
      if (!roomName) {
        return;
      }
      room = peer.joinRoom('mesh_video_' + roomName, {stream: localStream});
  
      $('#room-id').text(roomName);
      step3(room);
    });
  
    $('#end-call').on('click', () => {
      room.close();
      step2();
    });
  
    // Retry if getUserMedia fails
    $('#step1-retry').on('click', () => {
      $('#step1-error').hide();
      step1();
    });
  
    // set up audio and video input selectors
    const audioSelect = $('#audioSource');
    const videoSelect = $('#videoSource');
    const selectors = [audioSelect, videoSelect];
  
    navigator.mediaDevices.enumerateDevices()
      .then(deviceInfos => {
        const values = selectors.map(select => select.val() || '');
        selectors.forEach(select => {
          const children = select.children(':first');
          while (children.length) {
            select.remove(children);
          }
        });
  
        for (let i = 0; i !== deviceInfos.length; ++i) {
          const deviceInfo = deviceInfos[i];
          const option = $('<option>').val(deviceInfo.deviceId);
  
          if (deviceInfo.kind === 'audioinput') {
            option.text(deviceInfo.label ||
              'Microphone ' + (audioSelect.children().length + 1));
            audioSelect.append(option);
          } else if (deviceInfo.kind === 'videoinput') {
            option.text(deviceInfo.label ||
              'Camera ' + (videoSelect.children().length + 1));
            videoSelect.append(option);
          }
        }
  
        selectors.forEach((select, selectorIndex) => {
          if (Array.prototype.slice.call(select.children()).some(n => {
              return n.value === values[selectorIndex];
            })) {
            select.val(values[selectorIndex]);
          }
        });
  
        videoSelect.on('change', step1);
        audioSelect.on('change', step1);
      });
  
    function step1() {
      // Get audio/video stream
      const audioSource = $('#audioSource').val();
      const videoSource = $('#videoSource').val();
      const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined},
      };
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        $('#my-video').get(0).srcObject = stream;
        localStream = stream;
  
        if (room) {
          room.replaceStream(stream);
          return;
        }
  
        step2();
      }).catch(err => {
        $('#step1-error').show();
        console.error(err);
      });
    }
  
    function step2() {
      $('#their-videos').empty();
      $('#step1, #step3').hide();
      $('#step2').show();
      $('#join-room').focus();
    }
  
    function step3(room) {
      // Wait for stream on the call, then set peer video display
      room.on('stream', stream => {
        const peerId = stream.peerId;
        const id = 'video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '');
  
        $('#their-videos').append($(
          '<div class="video_' + peerId +'" id="' + id + '">' +
            '<label>' + stream.peerId + ':' + stream.id + '</label>' +
            '<video class="remoteVideos" autoplay playsinline>' +
          '</div>'));
        const el = $('#' + id).find('video').get(0);
        el.srcObject = stream;
        el.play();
      });
  
      room.on('removeStream', function(stream) {
        const peerId = stream.peerId;
        $('#video_' + peerId + '_' + stream.id.replace('{', '').replace('}', '')).remove();
      });
  
      // UI stuff
      room.on('close', step2);
      room.on('peerLeave', peerId => {
        $('.video_' + peerId).remove();
      });
      $('#step1, #step2').hide();
      $('#step3').show();
    }
  });
