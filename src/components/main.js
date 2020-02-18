const marshaller = require("@aws-sdk/eventstream-marshaller"); // for converting binary event stream messages to and from JSON
const util_utf8_node = require("@aws-sdk/util-utf8-node"); // utilities for encoding and decoding UTF8
const mic = require('microphone-stream');
const cryptojs = require("crypto-js");
const crypto = require("crypto");
//const util_utf8_node    = require("@aws-sdk/util-utf8-node"); // utilities for encoding and decoding UTF8
//const v4 = require('./aws-signature-v4'); // to generate our pre-signed URL

let socket;
let sampleRate = 44100;
let transcription = "";


// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);
streamTeacher();


function streamTeacher(){
	StartTranscribe.onclick = function() {

		StartTranscribe.disabled = true;
		StopTranscribe.disabled = false;

		navigator.mediaDevices.getUserMedia({audio: true})
			.then(stream => {
				//streaming data to transcribe
				micStream = new mic();
				micStream.setStream(stream);


				//record data to play after -- raw audio 
				audioChunks = []; 
	      		rec = new MediaRecorder(stream);
			    
			    let url = presignedURL();

			    //open up our WebSocket connection
    			socket = new WebSocket(url);
    			socket.binaryType = "arraybuffer";

    			socket.onopen = function(){
    				micStream.on('data', function(rawAudioChunk) {
			            // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
			            let binary = convertAudioToBinaryMessage(rawAudioChunk);

			            if (socket.OPEN)
			            	//document.getElementById("transcript").value = ("Socket open!");
			            	console.log(binary);
			                socket.send(binary);
		        	}
    			)};
    			socket.onmessage = function (message) {
			        //convert the binary event stream message to JSON
			        let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
			        let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
			        console.log(messageBody);
			        console.log(messageWrapper);
			        if (messageWrapper.headers[":message-type"].value === "event") {
			        	//console.log("whatever this is");
			        	handleEventStreamMessage(messageBody);
			        }
			        // else {
			        //     transcribeException = true;
			        //     showError(messageBody.Message);
			        //     toggleStartStop();
			        // }
			    };


			//     rec.ondataavailable = e => {
			//     	//let binary = convertAudioToBinaryMessage(e.data)
			    	
			//     	audioChunks.push(e.data);
			//         if (rec.state == "inactive"){
			//         	let blob = new Blob(audioChunks,{type:'audio/x-mpeg-3'});
			//         	recordedAudio.src = URL.createObjectURL(blob);
			//         	recordedAudio.controls=true;
			//         	recordedAudio.autoplay=true;
			// 			//audioDownload.href = recordedAudio.src;
	  //         			//audioDownload.download = 'mp3';
	  //         			//audioDownload.innerHTML = 'download';
			// 		}
			// 	}
			// rec.start();  
	    	})
			.catch(() => {
				alert("Microphone not allowed")
				StartTranscribe.disabled = false;
				StopTranscribe.disabled = true;
			});
	}

	StopTranscribe.onclick = function() {
		if (socket.OPEN) {			
	        micStream.stop();		//stop mic

	        // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
	        let emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));
	        let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
	        socket.send(emptyBuffer);
	        //document.getElementById("transcript").value = ("Socket closed!");
	    }

		StartTranscribe.disabled = false;
		StopTranscribe.disabled = true;
		document.getElementById("transcript").placeholder = "Press Start and speak into your mic";
		rec.stop();
	}
}
// ---- below is from AWS documentation ----

function convertAudioToBinaryMessage(audioChunk) {	
    let raw = mic.toRaw(audioChunk);

    if (raw == null)
       return;

    //downsample and convert the raw audio bytes to PCM
    let downsampledBuffer = downsampleBuffer(raw);
    let pcmEncodedBuffer = pcmEncode(downsampledBuffer);

    //add the right JSON headers and structure to the message
    let audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

    //convert the JSON object + headers into a binary event stream message
    let binary = eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
}

function presignedURL(){

	// REQUEST VARIABLES
	let protocol = "wss" //for websocket
	let method = "GET";
	let service = "transcribe";
	let lang = "en-US"; //American English -- can therefore use higher sample rate
	let region = "us-east-1"; //N Virginia
	let host = "transcribestreaming." + region + ".amazonaws.com:8443";
	let endpoint = protocol + "://transcribestreaming." + region + ".amazonaws.com:8443"; 
	let date = new Date();
	let amzdate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
	let datestamp = amzdate.substring(0, 8);
	let accesskey = "AKIAYP25NT2NPZBMPKLS"		//FIX THIS
	//let secretkey = encodeURI("XFhVV7cDg17LRfHHfNPB366mAwxX6CFf+9ZqEcF6");
	let secretkey = "HHfujWARSjvQ4HjrWcbpsgqHyiiK66rzZlBDVHd0";

	//CANONICAL INFO
	let canonical_uri = "/stream-transcription-websocket";
	let canonical_headers = "host:" + host + "\n";
	let signed_headers = "host";
	let algorithm = "AWS4-HMAC-SHA256";
	let credential_scope = datestamp + "/" + region + "/" + service + "/" + "aws4_request"

	//CREATE QUERY STRING
	let canonical_querystring  = "X-Amz-Algorithm=" + algorithm
	canonical_querystring += "&X-Amz-Credential="+ encodeURIComponent(accesskey + "/" + credential_scope)
	canonical_querystring += "&X-Amz-Date=" + amzdate 
	canonical_querystring += "&X-Amz-Expires=300"
	canonical_querystring += "&X-Amz-SignedHeaders=" + signed_headers
	canonical_querystring += "&language-code=" + lang + "&media-encoding=pcm&sample-rate=16000";
                    
	let payload_hash = crypto.createHash('sha256').update("", 'utf8').digest('hex');
	//payload_hash = crypto.HmacSHA256(("").Encode("utf-8").HexDigest());

	//let querystring = canonicalstring(canonical_querystring);
	//Create canonical request
	let canonical_request = method + '\n' 
   		+ canonical_uri + '\n' 
   		+ canonical_querystring + '\n' 
   		+ canonical_headers + '\n' 
   		+ signed_headers + '\n' 
   		+ payload_hash;

   	
   	//String to sign when requesting signature
   	let string_to_sign = algorithm + "\n"
   		+ amzdate + "\n"
   		+ credential_scope + "\n"
   		//+ crypto.HmacSHA256(canonical_request.Encode("utf-8")).HexDigest();
   		+ crypto.createHash('sha256').update(canonical_request, 'utf8').digest('hex');

   	//Create the signing key
	let signing_key = getSignatureKey(secretkey, datestamp, region, service);
                
	//Sign the string_to_sign using the signing key
	//signature = HMAC.new(signing_key, (string_to_sign).Encode("utf-8"), Sha256()).HexDigest;
	let signature = crypto.createHmac('sha256', signing_key).update(string_to_sign, 'utf8').digest("hex");
	//console.log(signature);
	canonical_querystring += "&X-Amz-Signature=" + signature;
	let request_url = endpoint + canonical_uri + "?" + canonical_querystring; //URL for the request
    //console.log("canonical string: ", canonical_request);
    //console.log("string-to-sign: ", string_to_sign);            
	return request_url;
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = crypto.createHmac("sha256","AWS4" + key).update(dateStamp,"utf8").digest();
    //var kRegion = cryptojs.createHmac(kDate, regionName);
    var kRegion = crypto.createHmac("sha256",kDate).update(regionName,"utf8").digest();
    //var kService = cryptojs.createHmac(kRegion, serviceName);
    var kService = crypto.createHmac("sha256",kRegion).update(serviceName,"utf8").digest();
    //var kSigning = cryptojs.createHmac(kService, "aws4_request");
    var kSigning = crypto.createHmac("sha256",kService).update("aws4_request","utf8").digest();
    return kSigning;
}

//--------FROM AUDIO.UTILS IN AWS GIT CODE-----------------------------
function pcmEncode(input) {
    var offset = 0;
    var buffer = new ArrayBuffer(input.length * 2);
    var view = new DataView(buffer);
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
}

function downsampleBuffer(buffer) {
	let outputSampleRate = 16000
    if (outputSampleRate === sampleRate) {
        return buffer;
    }

    var sampleRateRatio = sampleRate / outputSampleRate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Float32Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
        var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        var accum = 0,
        count = 0;
        for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
     }
     return result;
}

function getAudioEventMessage(buffer) {
    // wrap the audio data in a JSON envelope
    return {
        headers: {
            ':message-type': {
                type: 'string',
                value: 'event'
            },
            ':event-type': {
                type: 'string',
                value: 'AudioEvent'
            }
        },
        body: buffer
    };
}

let handleEventStreamMessage = function (messageJson) {
    let results = messageJson.Transcript.Results;

    if (results.length > 0) {
    	console.log(results[0]);
        if (results[0].Alternatives.length > 0) {
            let transcript = results[0].Alternatives[0].Transcript;

            // fix encoding for accented characters
            transcript = decodeURIComponent(escape(transcript));

            // update the textarea with the latest result
            document.getElementById("transcript").value = (transcription + transcript + "\n");

            // if this transcript segment is final, add it to the overall transcription
            // if (!results[0].IsPartial) {
            //     //scroll the textarea down
            //     document.getElementById("transcript").scrollTop($('#transcript')[0].scrollHeight);

            //     transcription += transcript + "\n";
            // }
        }
    }
}
