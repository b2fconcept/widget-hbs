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
	
	var $	 						= jQuery;
	var pluginName 					= "b2fHbsTemplate";
	var settings					= undefined;
	var divNonAttachedAuDomHelper	=  document.createElement('div');
	var templateCompiled			= {};
	var diacriticsMap 				= {};//pour defaultDiacriticsRemovalMap 
	var moteurDeTraduction			= undefined;
	var defaultHelper				= {};//afin de pouvoir appeler les fonction de ces helper dynamiquement, je suis oblig� de les attacher a un objet : 
	var listeHelpers 				= ['modulo', 'fromThesaurus', 'price', 'classement', 'nbPaxMax', 'lienDetail', 'trad', 'maps' , 'lienIframeResa'];
	
	
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
		} if ( action === "render" ) {
			return render(options);
		} if (action === "toUrl") {
			return toUrl(options);
		} else if (action === "armageddon") {
			return _armageddon(options);
		}
		
		return this;
	};
	
	
	
	$[ pluginName ].defaults = {
		imgHost				: 'hbs.b2f-concept.net',
		pagesHost			: '',//par defaut, on ne change pas d'host
		moteurDeTraduction	: 'b2fHbsTranslate',
		customHelpers		: {},//permet de surcharger les helper de ce plugin
		googleMapsKey		: false,
		remoteTplGetter		: "http://hbscms.caylus.b2f-concept.net/fr/hbs-templates-getter.htm",
		lienDetailHandler	: false
	};
	
	function render(options) {
		if (!(options.template in templateCompiled)) {		
			var source   = $('#'+options.template).html();
			if (undefined == source) {
				$.ajax({
					url 		: settings.remoteTplGetter,
					data		: {render_mode:"jsonp", tpl:[options.template+'.hbs']},
					dataType 	: 'jsonp',
				}).done(function(htmlRaw, textStatus, jqXHR) {
					$('body').append(htmlRaw);
					var source   = $('#'+options.template).html();
					if (undefined == source) {
						source = ''
						console.error(pluginName+' template "'+options.template+'" not found!');
					};
					_render(options, source); 
					
				})
			} else {
				_render(options, source); 
			}
		} else {
			_render(options, source); 
		}
		
	}
	
	function _render(options, source) {
		if (!(options.template in templateCompiled)) {
			templateCompiled[ options.template ] = Handlebars.compile(source);
		}
		var newContent = templateCompiled[ options.template ](options.params);
		options.done(newContent);
	}
	
	
	function _armageddon(options) {
		console.info(pluginName+'_armageddon:start');
		
		
		$(document).off('hbsPluginArmageddon.'+pluginName);
		
		templateCompiled			= {};
		diacriticsMap 				= {};//pour defaultDiacriticsRemovalMap 
		moteurDeTraduction			= undefined;
		//ne pas vider! => defaultHelper				= {};//afin de pouvoir appeler les fonction de ces helper dynamiquement, je suis oblig� de les attacher a un objet : 
		
		$.each(listeHelpers, function (index, helperName) {
			Handlebars.unregisterHelper(helperName);
		});
		
		//a faire en dernier, petit coquin ;)
		settings			= undefined;
		console.info(pluginName+'_armageddon:end');
	}
	
	function _init(options) {
		if (undefined == settings ) {
			settings = $.extend(true, {}, $[ pluginName ].defaults, options);
			
			moteurDeTraduction = $[settings.moteurDeTraduction];
			
			$.each(listeHelpers, function (index, helperName) {
				Handlebars.registerHelper(helperName, function (context, options) {
					return callHelper(this, helperName, context, options);
				});
			});
			
			_init_urlTransform();
			
			$(document).on('hbsPluginArmageddon.'+pluginName, _armageddon);//permet de retirer ce plugin, nescessaire pour le themeroller qui l'init pleins de fois (on doit donc proprement se retirer avant de se re-init)
		}
		//fin de on lance un init GLOBAL valable pour tous les forms manipul�s
	}
	
	function callHelper(thisArg, helperName, context, options) {
		if (typeof settings.customHelpers[helperName] !== 'undefined') {
			return settings.customHelpers[helperName].call(thisArg, context, options);
		} else {
			return defaultHelper[helperName].call(thisArg, context, options);
		}
	}
	
	function decodeHTMLEntities(str) {
		
		if(str && typeof str === 'string') {
			// strip script/html tags
			str 									= str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
			str 									= str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
			divNonAttachedAuDomHelper.innerHTML 	= str;
			str 									= divNonAttachedAuDomHelper.textContent;
			divNonAttachedAuDomHelper.textContent	= '';
		}
		
		return str;
	}
	
	defaultHelper.maps = function(context, options) {
		if (false == settings.googleMapsKey) {
			console.error(pluginName+' vous n\'avez pas definit de clef google map, on ne eput pas afficher la carte! Merci d\'initialiser la clef "googleMapsKey" du plugin "'+pluginName+'"');
			return options.inverse(this);
		}
		
		if (options.data) {
			var data = Handlebars.createFrame(options.data);
		} else {
			var data = {};
		}
		
		data.latitude 	= callHelper(context, 'fromThesaurus', 'b2f.geo.gps.lat', {hash : {index : 0} });
		data.longitude 	= callHelper(context, 'fromThesaurus', 'b2f.geo.gps.long', {hash : {index : 0} });
		data.cp 		= callHelper(context, 'fromThesaurus', 'b2f.geo.commune.cp', {hash : {index : 0} });
		data.nom 		= callHelper(context, 'fromThesaurus', 'b2f.geo.commune.nom', {hash : {index : 0} }).replace(/"/g, ' ');
		data.departement= callHelper(context, 'fromThesaurus', 'departement', {hash : {index : 0} }).replace(/"/g, ' ');
		data.clefGoogleMap = settings.googleMapsKey;
		
		if (data.latitude && data.longitude) {
			data.useLatLon = true;
			
		} else {
			data.useLatLon = false;
		}
		
		data.screenHeight = $(window).height();
		data.screenWidth = $(window).width();
		
		if (data.screenHeight > 640) {
			data.screenHeight = 640;
		}
		if (data.screenWidth > 640) {
			data.screenWidth = 640;
		}
		
		return options.fn(this, {data: data});
	}
	
	
	defaultHelper.trad = function(keyword, options) {
		if (typeof options === "undefined" ) {
			
			return new Handlebars.SafeString(moteurDeTraduction(keyword));
		} else {
			if (typeof options.hash === "undefined") {
				return new Handlebars.SafeString(moteurDeTraduction(keyword, options.data));
			} else {
				if (typeof options.hash.prefix !== "undefined") {
					keyword = options.hash.prefix + keyword;
				}
				
				var trad = moteurDeTraduction(keyword, $.extend({}, options.data, options.hash));
				
				if (typeof options.hash.emptyIfNoMatch !== "undefined"  && options.hash.emptyIfNoMatch == true && trad == keyword) {
					trad = '';
				}
				
				if (typeof options.fn !== "undefined" && trad != '') {
					if (options.data) {
						var data = Handlebars.createFrame(options.data);
					} else {
						var data = {};
					}
		
					trad = options.fn(this, {data: $.extend(data, {_:trad})});
				}
				
				return new Handlebars.SafeString(trad);
			}
		}
	}
	
	/**
	* formate l'input en un string SEO friendly
	* 
	*/
	function toUrl(str) {
		
		if(str && typeof str === 'string') {
			//en minuscule svp
			str = str.toLowerCase();
			
			//on enleve les accents
			str =  str.replace(/[^\u0000-\u007E]/g, function(a){ 
			   return diacriticsMap[a] || a; 
			});
			
			//on enleve les caract. speciaux :
			str =  str.replace(new RegExp('([^a-z0-9]+)', 'g'), '-');
			
		}
		
		return str;
	}
	

	/**
	 * permet de faire un if modulo
	 */
	defaultHelper.modulo = function(moduloDe, options) {
		var contexteDAppel 	= this;
		
		if (typeof options.hash.modulo !== "undefined") {
			var modulo = options.hash.modulo;
		}

		if (typeof options.hash.egal !== "undefined") {
			var egal = options.hash.egal;
		} else {
			egal = 0;
		}
		
		var resultatModulo = moduloDe % modulo;
		
		console.debug('modulo', {resultatModulo:resultatModulo, moduloDe:moduloDe, modulo:modulo, options:options, "options.data":options.data});
		
		if (typeof options.fn !== "undefined") {
			if (options.data) {
				var data = Handlebars.createFrame(options.data);
			} else {
				var data = {};
			}
			

			if (resultatModulo == egal) {
				return options.fn(this, {data: $.extend(data, {modulo})});
			} else {
				return options.inverse(this, {data: $.extend(data, {modulo})});
			}
			
		} 
		
		return modulo;
	}
	

	defaultHelper.lienDetail = function(context, options) {
	
		if (false == settings.lienDetailHandler || '' == settings.lienDetailHandler || 'lienDetail' == settings.lienDetailHandler) {
			return callHelper(this, 'lienDetailDefaultHandler', context, options);
		} else {
			return callHelper(this, settings.lienDetailHandler, context, options);
		}
	}

	defaultHelper.lienDetailDefaultHandler = function(context, options) {
		var contexteDAppel 	= this;
		
		
		var produit_ref 	= context.produit_ref.replace('.', '__2E').replace('#', '__23').replace('/', '__2F').replace('-', '__2D');
		var fournisseur_id 	= parseInt(context.fournisseur_id);
		var centrale_id 	= parseInt(context.centrale_id);
		var agence_id 		= parseInt(context.agence_id);
		
		
		
		var commune 		= toUrl(decodeHTMLEntities( callHelper(contexteDAppel, 'fromThesaurus', 'b2f.cont.gest.com', {hash : {index : 0}} ) ));
		var titre 			= toUrl(decodeHTMLEntities( callHelper(contexteDAppel, 'fromThesaurus', 'b2f.titre', {hash : {index : 0}}) ));
		var type 			= toUrl(decodeHTMLEntities(moteurDeTraduction('tifv3_'+callHelper(contexteDAppel, 'fromThesaurus', 'b2f.type.detail', {hash : {index : 0}}) )));
		
		var debut = options.data.root.rowSet.dateDebut;
		var duree = options.data.root.rowSet.duree;
		
		var paramsUrlDetail	= {reference:produit_ref, fournisseur_id:fournisseur_id, centrale_id:centrale_id, agence_id:agence_id, commune:commune, titre:titre, type:type, debut:debut, duree:duree};
		
		var urlReEcrite = $.b2fHbsHistory('buildUrlFromRoute', {routeName:'b2fHbsDetail', data:paramsUrlDetail});
		//var urlReEcrite = moteurDeTraduction('pageDetail', paramsUrlDetail);
		
		
		if (typeof options.fn !== "undefined") {
			if (options.data) {
				var data = Handlebars.createFrame(options.data);
			} else {
				var data = {};
			}
			
			
		
			return options.fn(this, {data: $.extend(data, {"lienSortant":false, "urlReEcriteHost":settings.pagesHost, "urlReEcrite":urlReEcrite, "paramsUrlDetail":paramsUrlDetail, "paramsUrlDetailStr":JSON.stringify(paramsUrlDetail)})});
		} 
		
		return urlReEcrite;
	}
	
	defaultHelper.lienDetailLienSortantHandler = function(context, options) {
		var contexteDAppel 	= this;
		
		var paramsUrlDetail	= {};
		
		var urlReEcrite = callHelper(contexteDAppel, 'fromThesaurus', 'b2f.url.ext.vel', {hash : {index : 0}}) 

		var parser 	= document.createElement('a');
		parser.href = urlReEcrite;
		/* cf : https://gist.github.com/jlong/2428561, http://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
		 *
		 *
		parser.href = "http://example.com:3000/pathname/?search=test#hash";
		 * 
		parser.protocol; // => "http:"
		parser.host;     // => "example.com:3000"
		parser.hostname; // => "example.com"
		parser.port;     // => "3000"
		parser.pathname; // => "/pathname/"
		parser.hash;     // => "#hash"
		parser.search;   // => "?search=test"
		parser.origin;   // => "http://example.com:3000"
		*/
		
		if (typeof options.fn !== "undefined") {
			if (options.data) {
				var data = Handlebars.createFrame(options.data);
			} else {
				var data = {};
			}
		
			return options.fn(this, {data: $.extend(data, {"lienSortant":true,"urlReEcriteHost":parser.protocol+'//'+parser.host, "urlReEcrite":parser.pathname+parser.search+parser.hash, "paramsUrlDetail":paramsUrlDetail, "paramsUrlDetailStr":JSON.stringify(paramsUrlDetail)})});
		} 
		
		return urlReEcrite;
	}
	
	
	defaultHelper.lienIframeResa = function(context, options) {
		var contexteDAppel 	= this;
		
		var produit_ref 	= context.produit_ref.replace('.', '__2E').replace('#', '__23').replace('/', '__2F').replace('-', '__2D');
		var fournisseur_id 	= parseInt(context.fournisseur_id);
		var centrale_id 	= parseInt(context.centrale_id);
		var agence_id 		= parseInt(context.agence_id);
		var debut 			= options.data.root.row.get.debut;
		var duree 			= options.data.root.row.get.duree;
		
		var paramsGet	 	= {reference:produit_ref, fournisseur_id:fournisseur_id, centrale_id:centrale_id, agence_id:agence_id, debut:debut, duree:duree};
		var paramsGetStr	= $.param(paramsGet);
		
		//console.log(pluginName+' lienIframeResa :', paramsGetStr, paramsGet);
		
		if (typeof options.fn !== "undefined") {
			if (options.data) {
				var data = Handlebars.createFrame(options.data);
			} else {
				var data = {};
			}
			return options.fn(this, {data: $.extend(data, {"iframeHost":settings.pagesHost, "iframePagePath":"/fr/hbs-ficheproduits-iframe-resa.htm", "paramsGetStr":paramsGetStr, "paramsGet":JSON.stringify(paramsGet)})});
		} 
		
		return settings.pagesHost+"/fr/hbs-ficheproduits-iframe-resa.htm"+'?'+paramsGetStr;
	}
	
	
	/////////////////////////////////////////////////////
	////////////// listing  /////////////////////////////
	/////////////////////////////////////////////////////
	defaultHelper.nbPaxMax = function(context, options) {
		var contexteDAppel 	= this;
		var data			= {};
		var nbPaxMax 		= callHelper(contexteDAppel, 'fromThesaurus', 'b2f.log.nbPer', {hash : {index : 0} });
		if (null == nbPaxMax) {
			return;//si ce code thesaurus n'es pas present pour ce produit, on passe au thesaurus suivant
		}
		var keyword = 'jusqu\'a $nbPaxMax personnes';
		var nbPaxMaxLib = moteurDeTraduction(keyword, {nbPaxMax:nbPaxMax});
		
		
		var nbPaxMaxPicto = document.location.protocol+'//'+settings.imgHost+'/images/icones/icon_pax/icon_pax_6.gif';
		if (nbPaxMax <6) {
			nbPaxMaxPicto = document.location.protocol+'//'+settings.imgHost+'/images/icones/icon_pax/icon_pax_'+nbPaxMax+'.gif';
		}
		
		
		if (options.data) {
			data = Handlebars.createFrame(options.data);
		}
		var customData = {"nbPaxMax":nbPaxMax, "nbPaxMaxLib":nbPaxMaxLib, "nbPaxMaxPicto":nbPaxMaxPicto };
		

		return options.fn(this, {data: $.extend(data, customData)});
	}//fin de function nbPaxMax
		
		
		
	
	/////////////////////////////////////////////////////
	////////////// listing  /////////////////////////////
	/////////////////////////////////////////////////////
	defaultHelper.classement = function(context, options) {
		var contexteDAppel = this;
		var classementCodeThesaurus = [
			'b2f.log.cla.autres',
			'b2f.log.cla.chem',        
			'b2f.log.cla.cles',     
			'b2f.log.cla.cocotte',
			'b2f.log.cla.epis',      
			'b2f.log.cla.etoile',  
			'b2f.log.cla.etoile.date',
			'b2f.log.cla.soleil',       
			'b2f.log.cla.tour'         
		];
		var arrayReturn = []
		
		$.each(classementCodeThesaurus, function(index, thesaurus) {
			var classementCode = callHelper(contexteDAppel, 'fromThesaurus', thesaurus, {hash : {index : 0} });

			if (null == classementCode) {
				return;//si ce code thesaurus n'es pas present pour ce produit, on passe au thesaurus suivant
			}
			var keyword = 'tifv3_'+classementCode;
			var classementLib = moteurDeTraduction(keyword, this);
			
			//console.debug('Handlebars.registerHelper.classementPush', {"classementCode":classementCode, "classementLib":classementLib});
			arrayReturn.push({"classementCode":classementCode, "classementLib":classementLib, "classementPicto": document.location.protocol+'//'+settings.imgHost+'/images/icones/icons_classification/'+classementCode+".gif"});
		});
		
		return options.fn(this, {data: options.data, blockParams: arrayReturn});
	}//fin de function classement
	
	/////////////////////////////////////////////////////
	////////////// listing  /////////////////////////////
	/////////////////////////////////////////////////////
	defaultHelper.price = function(context, options) {
		
		var customData = {};
		if (options.data) {
			customData = Handlebars.createFrame(options.data);
		}
		
		if (null == context.prixMin || 0 == context.prixMin) {
			console.warn(pluginName, ' price � ',context.prixMin ,' pour produit '+callHelper(context, 'fromThesaurus', 'b2f.titre', {hash : {index : 0} }));
			return options.inverse(this);
		}
		
		
		var prixPourUneDureeDe 		= null;
		var isFournisseur 			= callHelper(context, 'fromThesaurus', 'b2f.log.isFournisseur', {hash : {index : 0} });
		
		var montantPromo 			= 0;
		var montantPromoEuros		= 0;
		var isTypePromoPercentage 	= false;
		var isTypePromoAbsolue 		= false;
		var isPrixParPax			= false;
		var isRequest				= false;
		
		var prixMin 				= parseFloat(context.prixMin / 100).toFixed(2).toString().replace('.', ',');
		var jourDebutAsMaskBin 		= options.data.root.rowSet.jourDebutAsMaskBin;
		if (context.jourDebutPromo == 127 || ((context.jourDebutPromo & jourDebutAsMaskBin) != 0) ) {
			var montantPromo 	= context.prixMin * context.promoPercentage / 100;
			var isTypePromoPercentage 	= true;
			if (montantPromo < context.promoValue) {
				var montantPromo 	= context.promoValue ;
				var isTypePromoAbsolue 	= true;
			}
			var prixPromo 			= context.prixMin - montantPromo;
			var montantPromoEuros	= parseFloat(montantPromo / 100).toFixed(2).toString().replace('.', ','); 
		}
		
		if (options.data.root.rowSet.duree && 1 != isFournisseur) {
			prixPourUneDureeDe = options.data.root.rowSet.duree;
		}
		
		if (context.isPrixParPax) {
			isPrixParPax = true;
		}
		
		if (context.isRequest) {
			isRequest = true;
		}
		
		
		customData = $.extend(customData, {prixMin:prixMin, isRequest:isRequest, isPrixParPax:isPrixParPax, montantPromo:montantPromo, isTypePromoPercentage:isTypePromoPercentage, isTypePromoAbsolue:isTypePromoAbsolue, montantPromoEuros:montantPromoEuros,  promoPercentage:context.promoPercentage, prixPourUneDureeDe : prixPourUneDureeDe});
		
		return options.fn(context, {data: customData});
	}//fin de function price
	
	
	
	/////////////////////////////////////////////////////
	////////////// listing  /////////////////////////////
	/////////////////////////////////////////////////////
	defaultHelper.fromThesaurus = function(thesaurus, options) {
		var $return;
		
		
		if (typeof thesaurus !== "string") {
			$return = thesaurus;
		} else if (typeof this[thesaurus] !== "undefined") {
			$return = this[thesaurus];
		} else if (typeof this.computedFields !== "undefined" && typeof this.computedFields[thesaurus] !== "undefined") {
			$return = this.computedFields[thesaurus];
		} else if (typeof this.caracteristiques !== "undefined" && typeof this.caracteristiques[thesaurus] !== "undefined") {
			$return = this.caracteristiques[thesaurus];
		} else if (typeof this.caracteristiques_libelle !== "undefined" && typeof this.caracteristiques_libelle[thesaurus] !== "undefined") {
			$return = this.caracteristiques_libelle[thesaurus];
		} else {
			$return = null;
		}
		
		if (null == $return) {
			return null;
		}
		
		var typeOfReturn = typeof $return;
		
		if (typeof options.hash.index !== "undefined") {
			if (typeOfReturn == "object") {
				if ($return.constructor === Array) {
					$return = $return[options.hash.index];
				} else {
					$return = $return[Object.keys($return)[options.hash.index]];
				}
				
			}
			typeOfReturn = typeof $return;
		}
		
		if ('string' == typeOfReturn && typeof options.hash.decodeHTMLEntities !== "undefined") {
			$return = decodeHTMLEntities($return);
		}
		
		if ('string' == typeOfReturn && typeof options.hash.stripTags !== "undefined") {
			divNonAttachedAuDomHelper.innerHTML 	= $return;
			$return 								= divNonAttachedAuDomHelper.textContent.replace(/((\n(\s|\n)*)+)/g, '<br />');
			divNonAttachedAuDomHelper.textContent	= '';
		}
		
		
		if (
			'string' == typeOfReturn &&  
			(typeof options.hash.img !== "undefined" || typeof options.hash.imgWidth !== "undefined" || typeof options.hash.imgHeight !== "undefined")
		){
			$return = $return.replace('://', '&amp;b2fhttp;').replace('?', '&amp;b2famp;')
			var $listeId = this.fournisseur_id+'-'+this.agence_id+'-'+this.centrale_id;
			   
			if (typeof options.hash.imgWidth !== "undefined" || typeof options.hash.imgHeight !== "undefined") {
				if (typeof options.hash.imgWidth !== "undefined" && typeof options.hash.imgHeight !== "undefined") {
					var $dimention = options.hash.imgWidth+'-'+options.hash.imgHeight;
				} else if (typeof options.hash.imgWidth !== "undefined" ) {
					var $dimention = options.hash.imgWidth+'-';
				} else {
					var $dimention = '-'+options.hash.imgHeight;
				}  
			}
			$return =  document.location.protocol+'//'+settings.imgHost+'/UserFiles/Image/centrales/thumbs/'+$listeId+'/'+$dimention+'/'+$return;
		}
		if (typeof options.hash.href !== "undefined") {
			var queryParams = {
				   "produit_ref"	: this.produit_ref,
				   "fournisseur_id"	: this.fournisseur_id,
				   "agence_id"		: this.agence_id,
				   "centrale_id"	: this.centrale_id,
				   "dateDebut"		: this.dateDebut,
				   "duree"			: this.duree,
				   "nbPax"			: this.nbPax,
				   "dureeBase"		: this.dureeBase,
				   "sejour_nb"		: this.sejour_nb,
				   "ruleId"			: this.ruleId
			};
			   
			var $page = settings.pageDetail;
			   
			$return = $page + '?' + $.param(params);
			typeOfReturn = typeof $return;
		}
		   
		if (typeof options.hash.trad !== "undefined") {
			$return = moteurDeTraduction(options.hash.trad, this);
			typeOfReturn = typeof $return;
		}
		   
		if ('string' == typeOfReturn && typeof options.hash.truncate !== "undefined") {
			$return = $.truncate($return, { length: options.hash.truncate, words:true	});
		}
		
		if ('string' == typeOfReturn && typeof options.hash.toLower !== "undefined") {
			$return = $return.toLowerCase()
		}
		
		if ('string' == typeOfReturn && typeof options.hash.ucFirst !== "undefined") {
			$return = $return.charAt(0).toUpperCase() + $return.slice(1);
		}
		
		if ('string' == typeOfReturn && typeof options.hash.nl2br !== "undefined") {
			$return = $return.replace(/((\n(\s*\n)*)+)/g, '<br />');
		}
		

		if (typeof options.fn !== "undefined") {
			var extendedData = $.extend({index:0, first:true, last:true, item:$return}, options.data, {fromThesaurus:$return});
			
			if (typeOfReturn == "object" && (  $return.constructor !== String && $return.constructor !== Number && $return.constructor !== Boolean   )) {
				var tamponReturn = '';
				var returnKeys = Object.keys($return);
				var lastIteration = returnKeys.length - 1;
				for (var i = 0; i <= lastIteration; i++) {
					extendedData.index 	= i;
					extendedData.item 	= $return[returnKeys[i]]; 	//on emploie cette notation, bizarre, car c'est le seul moyen que j'ai trouv� pour faire des it�rations sur les "tableauxObjets" : {1:"toto", 2:"foo"}
					extendedData.first 	= (i == 0) ? true : false;
					extendedData.last 	= (i == lastIteration) ? true : false;
					tamponReturn 		+= options.fn(this, {data: extendedData});
				}
				$return 		= tamponReturn;
				tamponReturn 	= null;
				typeOfReturn 	= typeof $return;
			} else {
				return options.fn(this, {data: extendedData});
			}
			
		} 
		
		//laisser tout � la fin
		if (typeof options.hash.safeString !== "undefined" && true == options.hash.safeString) {
			return new Handlebars.SafeString($return);
		} 
		
		
		
		
		return $return;

	}//fin de function fromThesaurus
	
	
	/**
	* cette fonction "_init_urlTransform" et la fonciton "toUrl" sont  soumises a la licence apache version 2, car leur  source est issue de : http://stackoverflow.com/a/18391901/1138863
	* cf http://www.apache.org/licenses/GPL-compatibility.html => ce n'es pas g�nant , je cite "Apache 2 software can therefore be included in GPLv3 projects, because the GPLv3 license accepts our software into GPLv3 works".
	*
	*/
	function _init_urlTransform() {
		var defaultDiacriticsRemovalMap = [
			{'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
			{'base':'AA','letters':'\uA732'},
			{'base':'AE','letters':'\u00C6\u01FC\u01E2'},
			{'base':'AO','letters':'\uA734'},
			{'base':'AU','letters':'\uA736'},
			{'base':'AV','letters':'\uA738\uA73A'},
			{'base':'AY','letters':'\uA73C'},
			{'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
			{'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
			{'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
			{'base':'DZ','letters':'\u01F1\u01C4'},
			{'base':'Dz','letters':'\u01F2\u01C5'},
			{'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
			{'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
			{'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
			{'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
			{'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
			{'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
			{'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
			{'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
			{'base':'LJ','letters':'\u01C7'},
			{'base':'Lj','letters':'\u01C8'},
			{'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
			{'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
			{'base':'NJ','letters':'\u01CA'},
			{'base':'Nj','letters':'\u01CB'},
			{'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
			{'base':'OI','letters':'\u01A2'},
			{'base':'OO','letters':'\uA74E'},
			{'base':'OU','letters':'\u0222'},
			{'base':'OE','letters':'\u008C\u0152'},
			{'base':'oe','letters':'\u009C\u0153'},
			{'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
			{'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
			{'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
			{'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
			{'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
			{'base':'TZ','letters':'\uA728'},
			{'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
			{'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
			{'base':'VY','letters':'\uA760'},
			{'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
			{'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
			{'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
			{'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
			{'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
			{'base':'aa','letters':'\uA733'},
			{'base':'ae','letters':'\u00E6\u01FD\u01E3'},
			{'base':'ao','letters':'\uA735'},
			{'base':'au','letters':'\uA737'},
			{'base':'av','letters':'\uA739\uA73B'},
			{'base':'ay','letters':'\uA73D'},
			{'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
			{'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
			{'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
			{'base':'dz','letters':'\u01F3\u01C6'},
			{'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
			{'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
			{'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
			{'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
			{'base':'hv','letters':'\u0195'},
			{'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
			{'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
			{'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
			{'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
			{'base':'lj','letters':'\u01C9'},
			{'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
			{'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
			{'base':'nj','letters':'\u01CC'},
			{'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
			{'base':'oi','letters':'\u01A3'},
			{'base':'ou','letters':'\u0223'},
			{'base':'oo','letters':'\uA74F'},
			{'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
			{'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
			{'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
			{'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
			{'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
			{'base':'tz','letters':'\uA729'},
			{'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
			{'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
			{'base':'vy','letters':'\uA761'},
			{'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
			{'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
			{'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
			{'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
		];

		
		for (var i=0; i < defaultDiacriticsRemovalMap .length; i++){
			var letters = defaultDiacriticsRemovalMap [i].letters;
			for (var j=0; j < letters.length ; j++){
				diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap [i].base;
			}
		}
	}
	
	
})( jQueryB2f, window, document );