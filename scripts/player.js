var radio=chrome.extension.getBackgroundPage().radio;
console.log(radio);


function showSong(){
	var data=radio.c_song;
	if(data&&data.like==1){
		$("#like").attr("src","img/rated.png")
	}else{
		$("#like").attr("src","img/unrated.png")
	}
	if(radio.power==true){
		$("#power").attr("src","img/off.png")
	}else{
		$("#power").attr("src","img/on.png")
	}
	if(data.title){
		$("#song_title").html(data.title)
		$("#song_title").attr("title",data.title)	
		$("#song_artist").html(data.artist)
		$("#song_artist").attr("title",data.artist)
	}
};

$("#skip").bind("click",function(){
	if(!radio.power){
		return false;
	}
	radio.skip();
	showSong();
	return false;
});

$("#power").bind("click",function(){
	if(radio.power===false){
		radio.powerOn();
		$(this).attr("src","img/off.png")
		showSong();
	}else{
		radio.powerOff();
		$(this).attr("src","img/on.png")
		$("#song_title").html("--")
		$("#song_title").attr("title","")
		$("#song_artist").html("豆瓣电台")
		$("#song_artist").attr("title","豆瓣电台")

	}
	return false;
});

$("#like").bind("click",function(){
	if(!radio.power){
		return false;
	}
	if(radio.c_song.like==0){
		radio.like();
		$("#like").attr("src","img/rated.png");
		radio.c_song.like=1;
	}else{
		radio.unlike();
		$("#like").attr("src","img/unrated.png");
		radio.c_song.like=0;
	}
	return false;
});

$("#delete").bind("click",function(){
	if(!radio.power){
		return false;
	}
	radio.del();
	showSong()
	return false;
});

$("#comment_commit").bind("click",function(){
	var nodes=$(".comment_button")
	content=$("#comment_input").val()
	$.each(nodes,function(index,value){
		var isSelected=$(value).attr("selected")
		if(isSelected=="true"){
			doComment($(value).attr("id"),content)
		}
	})
});

$("#range")[0].addEventListener("input",function(){
	var d=$(this).val()
	var len=$(this).val()/100*50
	$("#volume_bar").css("width",len+"px")
	var a=radio.audio.volume=$(this).val()/100
	localStorage["volume"]=$(this).val()/100
})

$("#volume img").toggle(function(){
	$("#range").show()
	$("#volume_bar").show()
},function(){
	$("#range").hide()
	$("#volume_bar").hide()
})


function doComment(id,content){
	
	var s=localStorage[id]
	var ts=s.split(",")
	
	if(id=="fanfou"){
		sendApiRequest({
			url:"http://api.fanfou.com/statuses/update.json",
			method:"POST",
			content:{status:content},
			consumer_key:"327fe47f56d57ead9539c3498772fc3d",
			consumer_secret:"688edd10e5a2c923cf9421a644240e70",
			access_token:ts[0],
			access_secret:ts[1],
			onSuccess:function(data){
				console.log(data)
				$("#comment_popup").slideUp("slow",function(){
					$("#notify").fadeIn("slow").fadeOut("slow")
				})
			}
		})
	}

	if(id=="douban"){
	    var request_body = "<entry xmlns:ns0=\"http://www.w3.org/2005/Atom\" xmlns:db=\"http://www.douban.com/xmlns/\">";
		request_body += "<content>"+content+"</content>";
		request_body += "</entry>";		
		sendApiRequest({
			url:"http://api.douban.com/miniblog/saying",
			method:"POST",
			content:request_body,
			consumer_key:"0458f5fa0cd49e2a0d0ae1ee267dda7e",
			consumer_secret:"8670104fb9f59f9d",
			access_token:ts[0],
			access_secret:ts[1],
			contentType:"application/atom+xml;charset=utf-8",
			onSuccess:function(data){
				console.log(data)
				$("#comment_popup").slideUp("slow",function(){
					$("#notify").fadeIn("slow").fadeOut("slow")
				})
			}
		})
	}

	if(id="sina"){
		sendApiRequest({
			url:"http://api.t.sina.com.cn/statuses/update.json",
			method:"POST",
			content:{status:content,source:"694135578"},
			consumer_key:"694135578",
			consumer_secret:"683f9dd0a5d78c5488b7460a42e654c3",
			access_token:ts[0],
			access_secret:ts[1],
			onSuccess:function(data){
				console.log(data)
				$("#comment_popup").slideUp("slow",function(){
					$("#notify").fadeIn("slow").fadeOut("slow")
				})
			}
		})
	}
}

$("#comment_close").bind("click",function(){
	$("#comment_popup").slideUp()
})

$(".comment_button").bind("click",function(){
	var isSelected=$(this).attr("selected")
	if(isSelected=="true"){
		$(this).attr("selected","false")
		$(this).css("opacity","0.4")
	}else{
		$(this).attr("selected","true")
		$(this).css("opacity","1.0")
	}	
})

$("#share img").bind("click",function(){
	$("#comment_popup").slideDown("slow")
	var c= $(this).attr("class")
	$("#"+c).css("opacity","1.0")
			.attr("selected","true")
	var content=$("#song_artist").attr("title")+"--"+$("#song_title").attr("title")
	content="#豆瓣电台# "+content
	console.log(content)
	$("#comment_input").val(content)
})

$("#switcher").bind("click",function(){
	$("#channel_popup").fadeIn("slow")
	var sc=localStorage["channel"]?localStorage["channel"]:"0"
	var c=$("#"+sc)
	$("#"+sc).addClass("channel_selected")
		.siblings().removeClass("channel_selected")
})

$("#channels li").bind("click",function(){
	var sc=$(this).attr("id")
	localStorage["channel"]=sc
	radio.channel=sc
	$(this).addClass("channel_selected")
		.siblings().removeClass("channel_selected")
	$("#channel_popup").fadeOut("slow")
	if(radio.power==true){
		radio.powerOn();
		showSong();
	}
})

$("#close_c").bind("click",function(){
	$("#channel_popup").fadeOut("slow")
})


$("#pause").bind("click",function(){
	if(!radio.power){
		return false;
	}
	radio.audio.pause()
	$("#mask").show()
})

$("#mask").bind("click",function(){
	radio.audio.play()
	$("#mask").hide()
})

var audio=radio.audio
audio.addEventListener("ended",function(){
	showSong()	
})

audio.addEventListener("timeupdate",function(){
	var t=(this.currentTime/this.duration)*240
	$("#played").css("width",t+"px")
	var min=0
	var second=0
	var current=this.currentTime
	min=parseInt(current/60)
	second=parseInt(current%60)
	if(second<10){
		second="0"+second
	}
	var c=min+":"+second
	min=0
	second=0
	total=this.duration
	min=parseInt(total/60)
	second=parseInt(total%60)
	if(second<10){
		second="0"+second
	}
	var t=min+":"+second
	$("#timer").text(c+"/"+t)

})

var shares=localStorage["users"]
if(shares){
	$.each(shares.split(","),function(index,value){
		$("."+value.split("|")[2]).show()
		$("#"+value.split("|")[2]).show()
	})
}

if(radio.power){
	showSong();
	if(radio.audio.paused){
		$("#mask").show()
	}
}
var vol=localStorage["volume"]
if(!vol){
	vol=0.8
}
$("#range").val(vol*100)
$("#volume_bar").css("width",vol*50+"px")
audio.volume=vol


