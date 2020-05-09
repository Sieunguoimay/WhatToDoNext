class WebRTCConnection{
	constructor(){
		/*callback methods*/
		this.onerror = null;
		this.onopen = null;
		this.onclose = null;
		this.onmessage = null;
		this.sendSignalingMessage = null;
		var self = this;
		
		this.connection = new RTCPeerConnection();
		this.connection.onicecandidate = function(e){
			if(e.candidate!=null && self.sendSignalingMessage!=null){
				// console.log("sending ice candidate to remote peer");
				self.sendSignalingMessage({type:"candidate",data:e.candidate})
			}
		}
		this.connection.ondatachannel = function(e){
			console.log("new data channel created from the other side");
			e.channel.onmessage = (e)=>!self.onmessage||self.onmessage(e)
			e.channel.onopen = (e)=>!self.onopen||self.onopen(e);
			e.channel.onclose = (e)=>!self.onclose||self.onclose();
		}
		this.connection.oniceconnectionstatechange = function(){
			if(self.connection.iceConnectionState == 'disconnected') {
				console.log('Disconnected');
				!self.onclose||self.onclose();
			}
		}
		console.log("new data channel created");
		//create data channel for communication
		this.dataChannel = this.connection.createDataChannel('dataChannel');
		this.dataChannel.onmessage = (e)=>!self.onmessage||self.onmessage(e);
		this.dataChannel.onopen = (e)=>!self.onopen||self.onopen(e);
		this.dataChannel.onclose = (e)=>!self.onclose||self.onclose(e);
		
	}
	destroy(){
		this.dataChannel.close();
		this.dataChannel = null;
		this.connection.close();
		this.connection = null;
		
		!this.onclose||this.onclose();
		
		this.onerror = null;
		this.onopen = null;
		this.onclose = null;
		this.onmessage = null;
		this.sendSignalingMessage = null;
	}
	handleSignalingMessage(data){
		var self = this;
		// console.log("local",data);
		if(data.type === "candidate"){
			// console.log("local received ice candidate");
			this.connection.addIceCandidate(data.data).catch(function(err){
				self.onerror({status:"failed",error:err});
			});
		}else if(data.type ==="answer"){
			// console.log("local received an answer");
			this.connection.setRemoteDescription(data.data);


		}else if(data.type ==="offer"){
			// console.log("local received an offer");

			this.connection.setRemoteDescription(data.data);
			this.connection.createAnswer()
			.then(answer => self.connection.setLocalDescription(answer))
			.then(()=>{self.sendSignalingMessage({type:"answer",data:self.connection.localDescription})})
			.catch(function(err){console.log(err)});

		}
	}
	connect(){
		var self = this;
		


		this.connection.createOffer()
		.then(offer=>self.connection.setLocalDescription(offer))
		.then(()=>{
			if(self.sendSignalingMessage)
				self.sendSignalingMessage({type:"offer",data:self.connection.localDescription})
			else{
				self.onerror({status:"failed",error:"signaling channel not found"});
			}
		}).catch(function(err){
			self.onerror({status:"failed",error:err});
		});
		
	}
};