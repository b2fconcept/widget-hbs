/*
   widget personnalisable pour le HBS (connectizz)
   Copyright (C) 2016  B2f-concept
   
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation version 3 of the License.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software Foundation,
   Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
   
   vous pouvez nous contacter via notre site web http://www.b2f-concept.com rubrique contact
*/


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
	var pluginName 			= "b2fHbsPagination";
	var settings			= undefined;
	
	var offset 				= 0;
	var $window 			= $(window);
	
	var currentPage			= 1;
	var nextPage			= null;
	var nbPage				= null;
	var continuerScroll		= true;
	
	var afixVisible 		= false;
	
	var IsEnPause			= false;
	
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
		} if (action === "publicFunctionFoo") {
			$[ pluginName ].publicFunctionFoo(options)
		} else if (action === "armageddon") {
			return _armageddon(options);
		}

		
		return this;
	};
	
	
	
	$[ pluginName ].defaults = {

			unProduitSelector			: '.un-produit:eq(-5)',				//on chargera la page suivant a partir de cet element
			queryProcessingSelector		: 'body.b2f-hbs-liste-loading',		//si ce selecteur est matché, on ne lance pas de refresh
			listenTo					: 'b2fHbsListing.listingRenderData',	//cet evenement provoque la re-interpretation de unProduitSelector afin de calculer le nouvel offset
			pauseEvents					: 'pause.b2fHbsListing'
		};
	

	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		offset 				= 0;
		currentPage			= 1;
		nextPage			= null;
		nbPage				= null;
		continuerScroll		= true;
		afixVisible 		= false;
		IsEnPause			= false;
		
		
		$(document).off(settings.listenTo);
		$(document).off(settings.pauseEvents);
		$(document).off('scroll.'+pluginName);
		$(document).off('offsetChange.'+pluginName);
		$window.off('resize.'+pluginName);
		
		//a faire en dernier, petit coquin ;package
		settings			= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		//d'abord, on lance un init GLOBAL valable pour tous les forms manipulés
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			_initGlobal();
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipulés
		
	}
	
	//init GLOBAL valable pour tous les forms manipulés
	function _initGlobal() {
		
		$(document).on(settings.listenTo, refreshPaginationDataAndCalculOffset); 
		
		$(document).on(settings.pauseEvents, pause); 
		
		//on ecoute la fin du chargement de la page et la redimention
		$window.on('resize.'+pluginName, calculOffset);
		
		//on ecoute le scroll, et on charge les pages suivantes lorsque nescessaire
		$(document).on('scroll.'+pluginName+' offsetChange.'+pluginName, function(){
			if (undefined != offset && IsEnPause == false){
				if (offset.top-$window.height() <= $window.scrollTop() && $(settings.queryProcessingSelector).length == 0 && continuerScroll) {
					$.b2fHbsSearch('setPage', nextPage);
				}
			}
		});
		
		$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
	}
	
	function pause(event, mettreEnPause) {
		if (typeof mettreEnPause === "undefined") {
			mettreEnPause = false;
		}
		if (mettreEnPause) {
			IsEnPause = true;
		} else {
			IsEnPause = false;
		}
	}
	
	function refreshPaginationDataAndCalculOffset(event, isEmptyContentNeeded, currentListingData) {
		currentPage			= currentListingData.currentPage;
		nextPage			= currentListingData.nextPage;
		nbPage				= currentListingData.nbPages;
		continuerScroll 	= nextPage <= nbPage && nextPage > 1;
		
		calculOffset();
		
		return true;
	}
	function calculOffset() {
		var newOffset = $(settings.unProduitSelector).offset(); //on recalcul la valeur du offset
		if (offset != newOffset) {
			offset = newOffset;
		}
		
		$(document).trigger('offsetChange.'+pluginName);
		
		return true;
	}

	
	
	//AFIX : bouton retourner en haut
	// Only enable if the document has a long scroll bar et si on est assez bas
	if ($('body').outerHeight() > $(window).height()) {
		$('#top-link-block').removeClass('hidden').affix({
			// how far to scroll down before link "slides" into view
			offset: {top:100}
		});
		afixVisible	= true;
	}
	
	
})( jQueryB2f, window, document );