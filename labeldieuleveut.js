window.addEventListener("load", function(e) {
	var trackList = $('.audiotrack__play').toArray().map(function(t){
		return {
			id          : t.getAttribute('data-id'),
			title       : t.getAttribute('data-title'),
			src         : t.getAttribute('data-src'),
			currentTime : t.getAttribute('data-currenttime') ? parseInt(t.getAttribute('data-currenttime'))       : 0,
			volume      : t.getAttribute('data-volume')      ? parseFloat(t.getAttribute('data-volume'))          : 1,
			complete    : t.getAttribute('data-complete')    ? Boolean(parseInt(t.getAttribute('data-complete'))) : false,
		}
	});
	localData = JSON.parse(localStorage.getItem('wem_audiotracks_data'));
	if (localData === null || localData.length != trackList.length){
		localData = trackList;
	} else {
		for(var track of localData){
			if (trackList.filter(t=>{ return t.id==track.id;}).length) {
				trackList.filter(t=>{ return t.id==track.id;})[0].currentTime = track.currentTime;
				trackList.filter(t=>{ return t.id==track.id;})[0].volume      = track.volume;
				trackList.filter(t=>{ return t.id==track.id;})[0].complete    = track.complete;
			}
			if (track.complete)
				$('.audiotrack[data-audiotrack='+track.id+'] .audiotrack__listened').addClass('active');
		}
	}
	// console.log(localData);
	// console.log(trackList);
	var audioPlayer         = $('.audioPlayer');
	var audioPlayer__track  = audioPlayer.find('.audioPlayer__track');
	var audioPlayer__volume = audioPlayer.find('.audioPlayer__volume');
	var audioPlayer__mute   = audioPlayer.find('.audioPlayer__mute');
	var audioPlayer__next   = audioPlayer.find('.audioPlayer__button.next');
	var audioPlayer__prev   = audioPlayer.find('.audioPlayer__button.prev');
	var audioPlayer__play   = audioPlayer.find('.audioPlayer__button.play');
	var audioElement        = new Audio();
	var currentTrack        = false;
	var prevTrack        		= false;
	var nextTrack        		= false;
	var syncTimer;
	var volumeTimer;

	$('.audiotrack__play').on('click',function(){
		var track = trackList.filter(t=>{ return t.id==this.getAttribute('data-id');})[0];
		if (track != currentTrack)
			playerTogglePlay(!$(this).hasClass('playing'),track);
		else
			$('.audioPlayer__button.play').trigger('click');
	});
	audioPlayer__play.on('click',function(){
		if (!audioPlayer.hasClass('playing') && currentTrack)
			audioElement.play();
		else
			audioElement.pause();
	});
	audioPlayer__next.on('click',function(){
		if (nextTrack)
			playerTogglePlay(true,nextTrack);
	})
	audioPlayer__prev.on('click',function(){
		if (prevTrack)
			playerTogglePlay(true,prevTrack);
	})
	audioPlayer__track.on('mousedown',function(){audioPlayer__track.addClass('seeking'); });
	audioPlayer__track.on('mouseup',function(){audioPlayer__track.removeClass('seeking'); 
		// wait for the audioElement to register that time has changed
		setTimeout(function(){ 
			// console.log('syncSession - audioPlayer__track mouseup');
			syncSession();
		},100)
	})
	audioPlayer__track.on('change',function(){
		if (currentTrack)
			audioElement.currentTime = this.value;
	});
	audioPlayer__volume.on('input',function(){
		audioElement.volume = this.value;
	});
	audioPlayer__mute.on('click',function(){
		audioPlayer__mute.toggleClass('mute');
		audioElement.muted = audioPlayer__mute.hasClass('mute');
	});

	audioElement.addEventListener('volumechange',function(){
		clearInterval(volumeTimer);
		volumeTimer = setTimeout(function(){
			// console.log('syncSession - volumechange');
			syncSession();
		},500)
	})

	audioElement.addEventListener('play',function(){
		$('.audiotrack__play').removeClass('playing');
		$('.audiotrack__play[data-id='+currentTrack.id+']').addClass('playing');
		audioPlayer.find('.audioPlayer__title').attr('title',currentTrack.title).text(currentTrack.title);
		audioPlayer.addClass('playing');
		clearInterval(syncTimer);
		// console.log('syncSession - playing (first)');
		syncSession().then(function(){
			syncTimer = setInterval(function(){
				// console.log('syncSession - playing (auto)');
				syncSession();
			},10000)
		});
	});
	
	audioElement.addEventListener('ended',function(){});
	audioElement.addEventListener('pause',function(){
		// console.log('syncSession - pause');
		syncSession();
		clearInterval(syncTimer);
		$('.audiotrack__play').removeClass('playing');
		audioPlayer.removeClass('playing');
		
	});
	audioElement.addEventListener('loadeddata',function(){
		audioPlayer__track.attr('min',0);
		audioPlayer__track.attr('max',audioElement.duration);
		audioPlayer__track.attr('style','--min: 0; --max: '+Math.floor(audioElement.duration)+'; --val:'+Math.floor(audioElement.currentTime)+'');
		audioPlayer.find('.audioPlayer__duration').text(convertStoMs(audioElement.duration));
	});
	audioElement.addEventListener('timeupdate',function(){
		if (!audioPlayer__track.hasClass('seeking')) {
			audioPlayer__track.val(Math.floor(audioElement.currentTime));
			audioPlayer__track.get(0).style.setProperty('--val', +audioElement.currentTime);
		}
		audioPlayer.find('.audioPlayer__current').text(convertStoMs(audioElement.currentTime));
	});

	// likes management
	$('.audiotrack__likes').on('click',function(){
		var el = $(this);
		el.addClass('no-events');
		$.ajax({
			timeout: 10000,
			url: window.location.pathname,
			type: 'post',
			data:{
				'TL_AJAX':true ,
				'REQUEST_TOKEN':"<?php echo \RequestToken::get() ?>" ,
				'module': "<?php echo $this->module_id ?>" ,
				'action': 'feedback',
				'liked': !el.hasClass('liked'),
				'audiotrack': el.data('id'),
			},
		}).done(function(data){
			el.removeClass('no-events');
			try{var results = $.parseJSON(data); } catch(e){throw e;}
			if (results.status == "success"){
				el.toggleClass('liked');
				if (el.hasClass('liked'))
					el.find('.count').html(parseInt(el.find('.count').html())+1)
				else
					el.find('.count').html(parseInt(el.find('.count').html())-1)
			}
			else {
				throw results.msg
			}
		}).fail(function(jqXHR, textStatus){
			console.log(jqXHR, textStatus);
		});
	});

	var playerTogglePlay = function(play,track){
		if (play && track.src) {
			currentTrack = track;
			audioElement.src = track.src;
			audioPlayer__volume.val(track.volume).trigger('input');
			audioElement.currentTime = track.currentTime;
			audioPlayer.addClass('active');
			setPlayerButtons();			
			audioElement.play();
		} else {
			audioElement.pause();
		}
		// console.log(track);
		// console.log(audioElement);
	}

	var setPlayerButtons = function(){
		audioPlayer__next.removeClass('disabled');
		audioPlayer__prev.removeClass('disabled');
		if (trackList.indexOf(currentTrack)<trackList.length-1){
			nextTrack = trackList[trackList.indexOf(currentTrack)+1];
			audioPlayer__next.attr('title', nextTrack.title);
		}
		else{
			nextTrack = false;
			audioPlayer__next.attr('title','').addClass('disabled');
		}
		if (trackList.indexOf(currentTrack)>0){
			prevTrack = trackList[trackList.indexOf(currentTrack)-1];
			audioPlayer__prev.attr('title', prevTrack.title);
		}
		else{
			prevTrack = false;
			audioPlayer__prev.attr('title','').addClass('disabled');
		}
	}

	var convertStoMs = function(seconds) {
		let minutes = Math.floor(seconds / 60);
		let extraSeconds = Math.round(seconds % 60);
		minutes = minutes < 10 ? "0" + minutes : minutes;
		extraSeconds = extraSeconds< 10 ? "0" + extraSeconds : extraSeconds;
		return minutes + ":" + extraSeconds;
	}

	var setTrackComplete = function(track){
		track.complete = true;
		$('.audiotrack[data-audiotrack='+track.id+'] .audiotrack__listened').addClass('active');
	}

	var syncSession = function(){
	// console.log("syncSession");
		return new Promise(function(resolve,reject){
			if (audioElement.duration-audioElement.currentTime < 10 || currentTrack.complete)
				setTrackComplete(currentTrack);
			// console.log(localData);
			var data = localData.filter(t=>{ return t.id==currentTrack.id;})[0];
			data.currentTime = audioElement.currentTime;
			data.volume = audioElement.volume;
			data.complete = currentTrack.complete;
			// console.log(localData);
			// console.log(JSON.stringify(localData));

			localStorage.setItem('wem_audiotracks_data',JSON.stringify(localData));
			// $.ajax({
			// 	timeout: 10000,
			// 	url: window.location.pathname,
			// 	type: 'post',
			// 	data:{
			// 		'TL_AJAX':true ,
			// 		'REQUEST_TOKEN':"<?php echo \RequestToken::get() ?>" ,
			// 		'module': "<?php echo $this->module_id ?>" ,
			// 		'action': 'syncSession',
			// 		'audiotrack': currentTrack.id,
			// 		'currentTime': audioElement.currentTime,
			// 		'volume': audioElement.volume,
			// 		'complete': currentTrack.complete
			// 	},
			// }).done(function(data){
			// 	try{var results = $.parseJSON(data); } catch(e){throw e;}
      		// 	// console.log(results);
			// 	if (results.status == "success"){
			// 		resolve();
			// 	}
			// 	else {
			// 		throw results.msg
			// 	}
			// }).fail(function(jqXHR, textStatus){
			// 	reject();
			// });
		});
	}

	// tarteauciron workaround
	setTimeout(function(){
		if ($('#tarteaucitronIcon[class*=tarteaucitronIconBottom]').length)
			$('#tarteaucitronIcon').css('z-index',0)
	},500);
	// debug only
	// $('body').append(audioElement);
});