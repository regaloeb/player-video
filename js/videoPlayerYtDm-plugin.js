;(function($) {
	// Declaration du plugin
	$.videoPlayerYtDm = function(element, options) {

		// Pour éviter la confusion avec $(this)on declare plugin comme variable pour l'instance de notre plugin
		var plugin = this;

		// On crée un objet vide qui contiendra les options de notre plugin
		plugin.o = {}

		// Référence à l'élément jQuery que le plugin affecte
		var $elem = $(element);
		// Référence à l'élément HTML que le plugin affecte
		var elem = element;
		
		// Mise en place des options par défaut et/ou en attributs data de $elem
		var defaults = {
			videoId: ($elem.attr('data-videoId') && $elem.attr('data-videoId') != '') ? $elem.attr('data-videoId') : 0,
			autoPlay: ($elem.attr('data-autoplay') && $elem.attr('data-autoplay') != '') ? $elem.attr('data-autoplay') : 0,
			w: ($elem.attr('data-w') && $elem.attr('data-w') != '') ? $elem.attr('data-w') : 4,
			h: ($elem.attr('data-h') && $elem.attr('data-h') != '') ? $elem.attr('data-h') : 3,
			controls: ($elem.attr('data-controls') && $elem.attr('data-controls') != '') ? $elem.attr('data-controls') : 1,
			type: ($elem.attr('data-type') && $elem.attr('data-type') != '') ? $elem.attr('data-type') : 'yt'
		};
		
		plugin.init = function() {
			// on stocke les options dans un objet en fusionnant les options par defaut et celles ajoutées en parametre
			plugin.o = $.extend({}, defaults, options);
			
			var paddingBottom = (plugin.o.h / plugin.o.w) * 100 + "%";
			$elem.find('.iframe-container').css({'padding-bottom': paddingBottom});
			if(plugin.o.type == 'yt'){
				loadApiYT();
			}
			if(plugin.o.type == 'dm'){
				loadApiDM();
			}
		}

		// Ici on va coder nos méthodes privées / publiques
		//publiques : plugin.nomFonction = function(){}
		//privées : var nomFonction = function(){}
		var player, play, pause, stop, mute, unMute, seek, setVolume, getVolume, getCurrentTime, getDuration;
		
		//youtube
		var loadApiYT = function loadApiYT(callback) {
			var youtube_script = document.location.protocol;
			youtube_script += '//www.youtube.com/iframe_api';
			if ($('script[src="' + youtube_script + '"]').length === 0) {
				var tag = document.createElement('script');
				tag.src = youtube_script;
				var head = document.getElementsByTagName('head')[0];
				head.appendChild(tag);
			}
			iframeIsReadyYT(callback);
		}
		var iframeIsReadyYT = function iframeIsReadyYT(callback) {
			// Listen for Gobal YT player callback
			if (typeof YT === 'undefined' && typeof window.loadingPlayerYT === 'undefined') {
				// Prevents Ready Event from being called twice
				window.loadingPlayerYT = true;
				// Creates deferred so, other players know when to wait.
				window.dfd = $.Deferred();
				window.onYouTubeIframeAPIReady = function() {
					window.onYouTubeIframeAPIReady = null;
					window.dfd.resolve("done");
					initPlayer();
				};
			} 
			else if (typeof YT === 'object')  {
				initPlayer();
			}
			else {
				window.dfd.done(function( name ) {
					initPlayer();
				});
			}
		}
		
		//dailymotion
		var loadApiDM = function(callback){
			var dailymotion_script = document.location.protocol;
			dailymotion_script += '//api.dmcdn.net/all.js';
			if (jQuery('script[src="' + dailymotion_script + '"]').length === 0) {
				var tag = document.createElement('script');
				tag.src = dailymotion_script;
				var head = document.getElementsByTagName('head')[0];
				head.appendChild(tag);
			}
			
			if (typeof DM === 'undefined' && typeof window.loadingPlayerDM === 'undefined') {
				dmAsyncInit = function(){
					//DM.init({ apiKey: '83449d1d4a4386bb2316', status: false, cookie: true });
					initPlayer();
				};
				window.loadingPlayerDM = true;
				// Creates deferred so, other players know when to wait.
				window.dfddm = $.Deferred();
				window.dmAsyncInit = function() {
					window.dmAsyncInit = null;
					window.dfddm.resolve("done");
					initPlayer();
				};
			} 
			else if (typeof DM === 'object')  {
				initPlayer();
			}
			else {
				window.dfddm.done(function( name ) {
					initPlayer();
				});
			}
		}
		
		var initPlayer = function(callback){
			var cib = elem.getElementsByClassName('video-container')[0];
			//youtube
			if(plugin.o.type == 'yt'){
				player = new YT.Player(cib, {
					origin: '*',
					height: '100%',
					width: '100%',
					videoId: plugin.o.videoId,
					playerVars: { 'controls': plugin.o.controls, 'autohide': 1 },
					events: {
						'onReady': function(event) {
							$elem.find('.duration').text(getTime(getDuration()));
							if(plugin.o.autoPlay){
								event.target.playVideo();
								$elem.find('.play').addClass('active');
							}
							$elem.find(".chapter-line").each(function() {
								var percent = (100 / getDuration()) * parseFloat($(this).data('time')) + "%";
								$(this).css('left', percent);
							});
							updateVolumeBar();
						},
						'onStateChange': function(event) {
							//event.data == 1, play
							//event.data == 2, pause
							//event.data == 5, stop
							if(event.data === 1){
								stopAfficheTime();
								startAfficheTime();
							}
							if(event.data === 2){
								stopAfficheTime();
							}
							if(event.data === 5){
								stopAfficheTime();
							}
						}
					}
				});
			}
			if(plugin.o.type == 'dm'){
				//dailymotion
				$elem.find('.chapter-line').css('visibility', 'hidden');
				if(isMobile.Android()){
					$elem.find('.volume, .volumebar').css('display', 'none');
				}
				player = DM.player(cib, {
					video: plugin.o.videoId,
					width: '100%',
					height: '100%',
					params: {
						autoplay: plugin.o.autoPlay,
						controls: plugin.o.controls
					}
				});
				player.addEventListener("apiready", function(e){
					if(plugin.o.autoPlay === 1){
						$elem.find('.play').addClass('active');
					}
					setVolume(100);
					updateVolumeBar();
				});
				player.addEventListener("play", function(e){
					stopAfficheTime();
					startAfficheTime();
				});
				player.addEventListener("pause", function(e){
					stopAfficheTime();
				});
				player.addEventListener("stop", function(e){
					stopAfficheTime();
				});
				player.addEventListener("durationchange", function(e){
					$elem.find('.duration').text(getTime(getDuration()));
					$elem.find(".chapter-line").each(function() {
						var percent = (100 / getDuration()) * parseFloat($(this).data('time')) + "%";
						$(this).css({'left': percent, 'visibility': 'visible'});
					});
				});
			}
			
			setPlayerFunctions();
		}
		
		var setPlayerFunctions = function(){
			if(plugin.o.type == 'yt'){
				play = function(){
					player.playVideo();
				}
				pause = function(){
					player.pauseVideo();
				}
				stop = function(){
					player.stopVideo();
					setTimeout(resetSeekBar, 500);
				}
				mute = function(){
					player.mute();
				}
				unMute = function(){
					player.unMute();
				}
				seek = function(time){
					player.seekTo(time, true); //time in seconds
				}
				getCurrentTime = function(){
					return player.getCurrentTime();
				}
				getDuration = function(){
					return player.getDuration();
				}
				getVolume = function(){
					return player.getVolume();
				}
				setVolume = function(vol){
					return player.setVolume(vol);
				}
			}
			if(plugin.o.type == 'dm'){
				play = function(){
					player.play();
				}
				pause = function(){
					player.pause();
				}
				stop = function(){
					seek(0);
					player.pause();
					setTimeout(resetSeekBar, 500);
				}
				mute = function(){
					player.setMuted(true);
				}
				unMute = function(){
					player.setMuted(false);
				}
				seek = function(time){
					player.seek(time); //time in seconds
				}
				getCurrentTime = function(){
					return player.currentTime;
				}
				getDuration = function(){
					return Math.ceil(player.duration);
				}
				getVolume = function(){
					return player.volume*100;
				}
				setVolume = function(vol){
					return player.setVolume(vol/100);
				}
			}
			
			//controls
			if(plugin.o.controls == 1){
				$elem.find('.tools').css({'display': 'none'});
			}
			
			$elem.find('.play').click(function(e){
				e.preventDefault();
				$elem.find('.actions a').removeClass('active').removeClass('dome');
				$(this).addClass('active');
				play();
			});
			$elem.find('.pause').click(function(e){
				e.preventDefault();
				$elem.find('.actions a').removeClass('active').removeClass('dome');
				$(this).addClass('active');
				pause();
			});
			$elem.find('.stop').click(function(e){
				e.preventDefault();
				$elem.find('.actions a').removeClass('active').removeClass('dome');
				$(this).addClass('active');
				stop();
			});
			$elem.find('.volume').click(function(e){
				e.preventDefault();
				if($(this).hasClass('muted')){
					$(this).removeClass('muted');
					unMute();
				}
				else{
					$(this).addClass('muted');
					mute();
				}
			});
			
			// volumebar
			$('.volumebar').on('mouseup touchend input', function (e) {
				var vol = e.target.value;
				setVolume(vol);
				if(vol == 0){
					$elem.find('.volume').addClass('muted').removeClass('muted33').removeClass('muted66');
				}
				else if (vol <= 33 && vol > 0){
					$elem.find('.volume').removeClass('muted').addClass('muted33').removeClass('muted66');
				}
				else if (vol <= 66 && vol > 33){
					$elem.find('.volume').removeClass('muted').removeClass('muted33').addClass('muted66');
				}
				else{
					$elem.find('.volume').removeClass('muted').removeClass('muted33').removeClass('muted66');
				}

			});
			
			// timeline navigation
			$elem.find('.seekbar .progress').bind('click', function(event) {
				var clickPosition = event.clientX;
				var lineOffset = $elem.find('.seekbar').offset().left;
				var lineLength = $elem.find('.seekbar .progress .line').width();
				var time = getDuration() * ((clickPosition - lineOffset) / lineLength);
				seek(time);
				updateSeekbar();
			});
			
			//chapters
			$elem.find('.chapter').click(function(e){
				e.preventDefault();
				var time = $(this).data('time');
				seek(time);
				$elem.find('.chapter.active').removeClass('active');
				$(this).addClass('active');
			});
			
			//chapter-line
			$elem.find('.chapter-line').click(function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				var time = $(this).data('time');
				seek(time);
			});
			$elem.find('.chapter-line').each(function(index){
				$(this).hover(function(){
					var button = $elem.find('.chapter').eq(index);
					button.addClass('hover');
				}, function(){
					var button = $elem.find('.chapter').eq(index);
					button.removeClass('hover');
				});
			});
		}
		
		var getTime = function(time){
			var h = Math.floor(time/3600);
			var m = Math.floor(time/60);
			var s = Math.round(time%60);
			var h = (h == 0) ? '' : (h > 0 && h < 10) ? '0' + h + ':' : h + ':';
			var m = (m >= 0 && m < 10) ? '0' + m + ':' : m +':';
			var s = (s >= 0 && s < 10) ? '0' + s : s;
			var retour = h + m + s;
			return(retour);
		}
		
		var regalIntervTime;
		var startAfficheTime = function(){
			regalIntervTime = requestAnimationFrame(afficheTime);
		}
		
		var afficheTime = function() {
		  $elem.find('.time').text(getTime(Math.floor(getCurrentTime())));
		  $elem.find('.currentTime').text((Math.floor(getCurrentTime())));
		  updateSeekbar();
		  updateChapters();
		  regalIntervTime = requestAnimationFrame(afficheTime);
		}
		var stopAfficheTime = function(){
			cancelAnimationFrame(regalIntervTime);
		}
			
		var lastUpdateSeekbar = 0;
		var updateSeekbar = function() {
			var percent = (100 / getDuration()) * getCurrentTime() + "%";
			$elem.find('.seekbar .current').width(percent);
		}
		
		var resetSeekBar = function(){
			$elem.find('.seekbar .current').css({'width': 0});
			$elem.find('.chapter.active').removeClass('active');
			$elem.find('.chapter.done').removeClass('done');
			$elem.find('.chapter-line.active').removeClass('active');
			$elem.find('.chapter-line.done').removeClass('done');
		}
		
		var updateChapters = function() {
			var currentTime = getCurrentTime();
			$elem.find('.chapter, .chapter-line').each(function(){
				var chapterTime = $(this).data('time');
				var chapterEnd = $(this).data('end');
				if(currentTime >= parseFloat(chapterTime)) {
					$(this).addClass('done').removeClass('active');
					if(currentTime < parseFloat(chapterEnd)){
						$(this).removeClass('done').addClass('active');
					}
				}
				else{
					$(this).removeClass('done').removeClass('active');
				}
			});
		}	

		var updateVolumeBar = function() {	
			var currentVolume = getVolume();
			$elem.find('.volumebar').val(currentVolume);
		}		
		
		//is mobile
		var isMobile = { 
			Android: function() { return navigator.userAgent.match(/Android/i); }, 
			BlackBerry: function() { return navigator.userAgent.match(/BlackBerry/i); }, 
			iOS: function() { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, 
			Opera: function() { return navigator.userAgent.match(/Opera Mini/i); }, 
			Windows: function() { return navigator.userAgent.match(/IEMobile/i); }, 
			any: function() { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } 
		};
		var isiPad = navigator.userAgent.match(/iPad/i) != null;
				
		// On appele la méthode publique init qui va se charger de mettre en place toutes les méthodes de notre plugin pour qu'il fonctionne
		plugin.init();
	}

	// On ajoute le plugin à l'objet jQuery $.fn
	$.fn.videoPlayerYtDm = function(options) {
		// Pour chacun des élément du dom à qui on a assigné le plugin
		return this.each(function() {
			// Si le plugin n'as pas deja été assigné à l'élément
			if (undefined == $(this).data('videoPlayerYtDm')) {
				// On crée une instance du plugin avec les options renseignées
				var plugin = new $.videoPlayerYtDm(this, options);
				// on stocke une référence de notre plugin pour pouvoir accéder à ses méthode publiques
				// appel depuis ext : $('#objet').data('videoPlayerYtDm').fonctionPublique(params);
				$(this).data('videoPlayerYtDm', plugin);
			}
		});
	}
})(jQuery);




/*
	RequestAnimationFrame Polyfill
	http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	by Erik Möller, fixes from Paul Irish and Tino Zijdel
	MIT license
 */ 
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (! window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (! window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());
