/**
 *OAuth1.0通用模块
 * */
var OAuthHelper=function(arg){
	this.api_key =arg.api_key
	this.api_key_secret =arg.api_key_secret
	this.request_token = "";
	this.request_token_secret = "";
	this.access_token = "";
	this.access_token_secret = "";
	this.signature_method = arg.signature_method
	this.request_token_uri = arg.request_token_url 
	this.access_token_uri = arg.access_token_url
	this.authorization_uri = arg.authorization_url
	this.prefix=arg.prefix
	this.callback=arg.callback
	this.type=arg.type	
}


OAuthHelper.prototype.auth=function(){
	this.getRequestToken()

}

OAuthHelper.prototype.getRequestToken=function(){
	var message = {
		method: "GET",
		action: this.request_token_uri,
		parameters: {
			oauth_consumer_key: this.api_key,
			oauth_signature_method: this.signature_method,
			oauth_signature: "",
			oauth_timestamp: "",
			oauth_nonce: ""
		}
	}
	// 签名
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, {
		consumerSecret: this.api_key_secret
	})
	var self=this
	$.get(message.action,message.parameters,function(response){
		var responseObj = OAuth.getParameterMap(OAuth.decodeForm(response));				
		self.request_token = responseObj.oauth_token
		self.request_token_secret = responseObj.oauth_token_secret
		console.log("request token: "+self.request_token)
		console.log("request token secret: "+self.request_token_secret)
		var random=Math.random()
		var url=self.authorization_uri + self.request_token+"&oauth_callback="+encodeURI(window.location.origin+"/oauth_callback.htm")+"?r="+random;	
		window.open(url,'','width=600px,height=400px')
		self.onAuthorized(random)	
	})									
}

/**
 * 用户授权后回调方法
 * */
OAuthHelper.prototype.onAuthorized=function(random){
	var self=this
	function doEvent(tabId,info,tab){
		var b=tab.url.indexOf(self.authorization_uri)
		if(info.status=="loading"&&tab.url.indexOf("oauth_callback.htm")>-1&&tab.url.indexOf(self.authorization_uri)<0
			&&tab.url.indexOf(random)>-1){
			console.log("callback url:"+tab.url)
			var oauth_verify = tab.url.match(new RegExp("[\?\&]oauth_verifier=([^\&]*)(\&?)","i"));
			console.log("oauth_verifier:"+oauth_verify)
			if(oauth_verify&&oauth_verify.length>=2)
				self.oauth_verify=oauth_verify[1]
			self.getAccessToken()
			chrome.tabs.onUpdated.removeListener(doEvent);
		}
	}
	chrome.tabs.onUpdated.addListener(doEvent)
}

/**
 *获取AccessToken
 * */
OAuthHelper.prototype.getAccessToken=function(){
	var message = {
		method: "GET",
		action: this.access_token_uri,
		parameters: {
			oauth_consumer_key: this.api_key,
			oauth_token:this.request_token, 
			oauth_signature_method: this.signature_method,
			oauth_signature: "",
			oauth_timestamp: "",
			oauth_nonce: ""
		}
	}
	if(this.oauth_verify){
		console.log("has oauth_verifier")
		$.extend(message.parameters,{oauth_verifier:this.oauth_verify})

	}
	OAuth.setTimestampAndNonce(message);
	console.log(this.api_key_secret)
	console.log(this.request_token_secret)
	OAuth.SignatureMethod.sign(message, {
		consumerSecret: this.api_key_secret,
		tokenSecret: this.request_token_secret
	});
	var self=this
	$.get(message.action,message.parameters,function(response){
		var responseObj = OAuth.getParameterMap(OAuth.decodeForm(response));
		access_token = responseObj.oauth_token
		access_token_secret = responseObj.oauth_token_secret
		console.log("access_token:"+access_token)
		console.log("access_token_secret:"+access_token_secret)
		localStorage[self.type]=access_token+","+access_token_secret;
		self.callback&&self.callback(access_token,access_token_secret)
	})		
}

