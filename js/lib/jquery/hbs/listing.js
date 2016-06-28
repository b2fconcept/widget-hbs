// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( jQuery, window, document, undefined ) {
	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).
	
	
	"use strict"; //http://www.w3schools.com/js/js_strict.asp
	
	var $	 				= jQuery;
	var pluginName 			= "b2fHbsListing";
	var settings			= undefined;
	var pendingSearchJqXhr	= null;
	var currentListingData 	= null;
	
	//fallback pour les appels a console.log : 
	if (typeof window.console === "undefined"){
		var console = {
				log:function () {}, info:function () {}, warn:function () {}, debug:function () {}, error:function () {}
		};
	} else {
		console = window.console;
	}
	//fin du fallback pour les appels a console.log : 
	
	$[ pluginName ] = function(action, options) {
		if ( action === "init") {
			_init(options);
		} if ( action === "hide" ) {
			hide(options);
		} if (action === "show") {
			show(options);
		} else if (action === "armageddon") {
			return _armageddon(options);
		}
		
		return this;
	};
	
	
	
	$[ pluginName ].defaults = {
		listingSelector 			: 'div[data-type="hbs-basic-listing"]',//le plugin sera actif pour tous ces elements
		template					: 'hbs-basic-listing',
		formulaireSeachWidgetName	: 'b2fHbsSearch',
		emptyAndFetchNewDataOnEvent	: 'b2fHbsSearch.formDataChange',
		fetchNewDataOnEvent			: 'b2fHbsSearch.paginationChange',
		pauseOnEvent				: 'beforeFetchNewData.b2fHbsDetail fetchNewDataFailed.b2fHbsDetail, backButton.b2fHbsDetail',
		fetchNewDataHost			: 'http://hbscms.caylus.b2f-concept.net',
		fetchNewDataUrl				: '/fr/hbs-listeproduits.htm?render_mode=jsonp',
		moteurDeTemplate			: $.b2fHbsTemplate,//le plugin de template est censé être pre-initialisé
		wrapperAttrs 				: {
			class: "b2fHbsListing-wrapper"
		},
		wrapperCSS 					: {
		  // mettre des propriétés CSS ici
		},
		onFetchNewData 				: function() {
			
		},
		onListingRenderData : function(data) {
			return data;//il est obligatoire de renvoyer les nouvelles data!
		},
		titreBalise					: 'h3',
		sousTitreBalise				: 'h4',
		descTruncateNbChar			: 300,
		doUseTwoColumns				: 1,
		imgClasses					: 'img-rounded img-responsive',
		listeInsee					: ''
	};
	

	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		$(document).removeData(pluginName+'pause');
		
		$(document).off(settings.emptyAndFetchNewDataOnEvent); 	//lorsque le plugin de moteur de recherche diffuse l'info qu'il a changé de valeur, on lance alors une mise a jour de la liste de resultat
		$(document).off(settings.fetchNewDataOnEvent); 			//lorsque le plugin de pagination diffuse l'info qu'il a changé de valeur, on lance alors une mise a jour de la liste de resultat
		
		$(document).off(settings.pauseOnEvent);
		
		$(document).off(pluginName+'.listingFetchNewData');
		
		$(settings.listingSelector).each(function() {
			$.removeData(this, pluginName+'_init');
		});
		
		//en dernier petit coquin ;p
		settings 		= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		//d'abord, on lance un init GLOBAL valable pour tous les forms manipulés
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			
			settings.doUseTwoColumns = parseInt(settings.doUseTwoColumns);//on a besoin d'avoir un int
			
			_initGlobal();
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipulés
		//ensuite, on lance un init LOCAL fait une fois par formulaire manipulé
		$(settings.listingSelector).each(function() {
			//protection 'init run once'
			if ( $.data( this, pluginName+'_init' ) ) {
				return;
			}
			$.data(this, pluginName+'._init', true);//on stock la conf de ce widget dans le dom de l'elemnts qui l'instancie
			//fin de protection 'init run once'
			
			_initListingElement.call(this);
		})
		//fin de on lance un init LOCAL fait une fois par formulaire manipulé
	}
	
	//init GLOBAL valable pour tous les forms manipulés
	function _initGlobal() {
		
		$(document).data(pluginName+'pause', false);
		
		$(document).on(settings.emptyAndFetchNewDataOnEvent	, {empty:true} , fetchNewData); 	//lorsque le plugin de moteur de recherche diffuse l'info qu'il a changé de valeur, on lance alors une mise a jour de la liste de resultat
		$(document).on(settings.fetchNewDataOnEvent			, {empty:false}, fetchNewData); 			//lorsque le plugin de pagination diffuse l'info qu'il a changé de valeur, on lance alors une mise a jour de la liste de resultat
		
		$(document).on(settings.pauseOnEvent				, pauseOnEvent);//
		
		$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
		
	}
	
	//init LOCAL fait une fois par formulaire manipulé
	function _initListingElement() {
		var $this = $(this);
		
		$.data(this, pluginName+'_settings', $.extend(true, {}, settings, $this.data( pluginName.toLowerCase()+'ExtendSettings' )));//on accepte des settings custom
		
		var elementSettings = $.data(this, pluginName+'_settings');
		
		settings.moteurDeTemplate('render', {
			template 	: elementSettings.template,
			params		: {settings:elementSettings, setting:elementSettings},
			done		: function(newContent) {
				$this.empty().append(newContent);
				
				$(document).on(pluginName+'.listingFetchNewData', listingRenderData);
			}
		});
				
	}
	
	
	function fetchNewData(event) {
		console.log(pluginName, ' fetchNewData:start');
		
		$(document).trigger(pluginName+'.beforeListingFetchNewData');
		var formData = $[settings.formulaireSeachWidgetName].serializeArray();
	    
		var page = $[settings.formulaireSeachWidgetName]('getPage');
		
		//ajax : lorsque les data changent, il faut rafraichir tous les moteurs afin qu'ils soient mis à jour, pour cela, on interroge le serveur avec les nouveaux params
		$.ajax({
				url			: settings.fetchNewDataHost + settings.fetchNewDataUrl,
				data		: formData,
				dataType 	: 'jsonp',
				beforeSend	: function( jqXHR ) {
					if (pendingSearchJqXhr != null) {
						pendingSearchJqXhr.abort();
					}
					pendingSearchJqXhr = jqXHR;
					$('body').addClass('b2f-hbs-liste-loading');
					$('body').addClass('b2f-hbs-liste-loading-page-'+page);
				}
		 	})
		 	.done(function( data, textStatus, jqXHR ) {
		 		currentListingData = data;
		 		settings.onFetchNewData.call(this, event);
		 		
		 	
		 		//console.log('triggerEvent : '+pluginName+'.listingFetchNewData');
			    $(document).trigger(pluginName+'.listingFetchNewData', [event.data.empty, currentListingData]);
			    console.log(pluginName+'fetchNewData:done', textStatus);
		 	})
		 	.fail(function( jqXHR, textStatus, errorThrown ) {
		 		console.log(pluginName+'fetchNewData:failed', textStatus);
		 	}).always(function( dataOrJqXHR, textStatus, jqXHROrErrorThrown ) {
		 		pendingSearchJqXhr = null;
				$('body').removeClass('b2f-hbs-liste-loading');
				$('body').removeClass('b2f-hbs-liste-loading-page-'+page);
		 		console.log(pluginName+'fetchNewData:always', textStatus);
		 	});
		//fin de ajax
		
		return true;
	}
	

	function listingRenderData(event, isEmptyContentNeeded, currentListingData) {
		console.log(pluginName, '::listingRenderData');
		$(settings.listingSelector).each(function() {
			var $this 			= $(this);
			var elementSettings = $this.data(pluginName+'_settings');
			var data 			= elementSettings.onListingRenderData.call(this, currentListingData); //les data a render sont dans currentListingData, on permet de les manipuler via un callback
			
			settings.moteurDeTemplate('render', {
				template 	: elementSettings.template,
				params		: {"settings":settings, "setting":settings, "rowSet":data},
				done		: function(newContent) {
					if (isEmptyContentNeeded) {
						$this.empty().data('scrollPosition', null);
					}
		
					$this.append(newContent);
					
					show();
				}
			});
			
					
		});
		
		$(document).trigger(pluginName+'.listingRenderData', [isEmptyContentNeeded, currentListingData]);
	}
	
	function pauseOnEvent(event, options) {
		if ('modal' == options.renderType) {
			
		}
		
		if (false == options.visible) {
			show(options);
		} else {
			hide(options);
		}
	}
	
	function hide(options) {
		if (pendingSearchJqXhr != null) {
			pendingSearchJqXhr.abort();
		}
		pendingSearchJqXhr = null;
		
		var currentPauseState = $(document).data(pluginName+'pause');
		if (currentPauseState == false) {
			$(document).data(pluginName+'pause', true);
			$(document).trigger('pause.'+pluginName, [true]);
			$(settings.listingSelector).data('scrollPosition', document.body.scrollTop ).hide(0);
		}
	}
	
	function show(options) {
		var currentPauseState = $(document).data(pluginName+'pause');
		if (currentPauseState == true) {
			$(document).data(pluginName+'pause', false);
			$(document).trigger('pause.'+pluginName, [false]);
			var $listingSelector = $(settings.listingSelector);
			
			$[settings.formulaireSeachWidgetName]('pushCurrentState');
			
			var defaultOption = {
				duration : 0,
				complete :  function () {
					var scrollPosition = $listingSelector.data('scrollPosition');
					if (undefined != scrollPosition && null != scrollPosition) {
						$('html, body').animate({scrollTop:scrollPosition+'px'}, 0);
					}
					$listingSelector.data('scrollPosition', null);
				}//fin de complete : function() {
			}
			
			$listingSelector.show($.extend(defaultOption, 0));
		}
		
	}
	
})( jQueryB2f, window, document );