/***
 * JSAPI v0.1 (https://github.com/nherman/jsapi)
 * MIT License: https://github.com/nherman/jsapi/blob/master/LICENSE
 ***/
;
window.JSAPI = window.JSAPI || (function() {
	"use strict";

	var 

		methodType,

		/* map containing all loaded apis */
		apiMap = {},

		/* default list of method types to attached to API endpoints */
		methodTypes = {
			"create":true,
			"read":true,
			"update":true,
			"delete":true
		},

		/* prevent calls to console.log from throwing an error in browsers that don't support it */
		console = window.console || {log:function(){ return; }},

		/* shortcut saves extra prototype tree traversals */
		hasOwnProp = Object.prototype.hasOwnProperty,

		/* helper function returns true if passed an object that contains ownPropeties */
		hasOwn = function(obj) {
			var key;
			if (obj === undefined || !obj instanceof Object) { return false; }
			for (key in obj) {
		        if (hasOwnProp.call(obj, key)) { return true; }
		    }
		    return false;
		},

		/* 
			Extend:	helper function for copying parameters from one object to another.
			Not a "full" object copy.  Array are assume to be flat, and contain only strings. Object depth limited
		*/
		extend = function(obj, extension, overwrite, depth){
			var i, j, key,
				maxDepth=1; //keep copies shallow in case there's a bug in the config
			if (overwrite !== false) {
				overwrite = true;
			}
			if (depth === undefined) {
				depth = 0;
			}
			for (key in extension){
		        if (hasOwnProp.call(extension, key)) {

	        		/* copy arrays - only arrays of strings allowed */
	        		if (extension[key] instanceof Array) {
	        			if (!obj[key] instanceof Array && !overwrite) continue;
	        			/* http://stackoverflow.com/questions/1584370 */
	        			obj[key] = (obj[key] || []).concat(extension[key]);
	        			for (i=0; i<obj[key].length; ++i) {
	        				for (j=i+1; j<obj[key].length; ++j) {
	        					if (obj[key][i] === obj[key][j]) {
	        						obj[key].splice(j--,1);
	        					}
	        				}
		        		}
		        	} else if (extension[key] instanceof Object) {
	        			if (!obj[key] instanceof Object && !overwrite) continue;

	        			obj[key] = obj[key] || {};
	        			if (depth <= maxDepth) {
		        			extend(obj[key],extension[key],overwrite,depth++);
		        		}

		        	} else if (obj[key] === undefined || overwrite) {
						obj[key] = extension[key];
					}

					
				}
			}
		},

		/* helper function for instantiating new XMLHttpRequest objects */
		getXHR = function() {
			var xhr = new XMLHttpRequest();
			if (!hasOwnProp.call(xhr, "withCredentials")) {
				xhr = null;
			} else {
				xhr.withCredentials = true;
			}
			return xhr;
		};

	/* factory:
	 * creates handlers for each request type
	 * param: type - method name
	 * param: types - allowed method names
	 */
	function EndPointMethodFactory(type) {
		type = type.toLowerCase();

		if (type === "stream") {

			/* Server Sent Events method
			 * param: data = {
			 *		callbacks: {}
			 * }
			 */
			return function(data) {
				var i, source,
					options=this.options[type],
					url="";


				if (options === undefined ||
						data === undefined ||
						!hasOwn(data.callbacks)) {
					return;
				}


				/*
					Merge pathTemplate string with urlData to create the endpoint URL
				*/
				url = this.getURL(data.urlData);


				if (!!window.EventSource) {
					/* init EventSource Object */
					source = new EventSource(url);

					/* Assign Callbacks */
					for (i in data.callbacks) {
						if (hasOwnProp.call(data.callbacks,i) && typeof data.callbacks[i] === "function") {
							source.addEventListener(i, data.callbacks[i], false);
						}
					}

					return source;
				}
			};

		}


		/* CRUD method (or other method type, if endpoint.methodTypes is populated)
		 * param: data = {
				urlData: {},
				paramData: {},
				headerData: {},
				callbacks: {}
		 * }
		 */
		return function(data) {
			var xhr,i,
				options=this.options[type],
				paramArray=[],
				params="",
				url="";

			if (options === undefined) {
				return;
			}

			data = data || {};


			/*
				Merge pathTemplate string with urlData to create the endpoint URL
			*/
			url = this.getURL(data.urlData);

			/* 
				Join parameter data into a query string.
				Append to the URL if we're making a GET request
			*/
			if (data.paramData instanceof Object && options.params instanceof Array) {
				for (i=0; i<options.params.length; i++) {
					if (data.paramData[options.params[i]] !== undefined) {
						paramArray.push(options.params[i] + "=" + data.paramData[options.params[i]]);
					}
				}
				params = paramArray.join("&");

				if (options.method === "GET" && params.length > 0) {
					url += "?" + params;
				}
			}

			/* 
			 * Instantiate and configure the XHR object
			 */
			xhr = getXHR();
			xhr.open(options.method, url);

			/* always assign a content-type header */
			if (options.method === "GET") {
				xhr.setRequestHeader("Content-type", "application/json");
			} else {
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			}

			/* assign endpoint-specific request headers. will override content-type header */
			if (options.requestHeaders instanceof Object) {
				if (data.headerData instanceof Object) {
					/* import header values specific to this method call */
					for (i in data.headerData) {
						if (hasOwnProp.call(data.headerData,i) && options.requestHeaders[i] !== undefined) {
							options.requestHeaders[i] = data.headerData[i];
						}
					}
				}

				for (i in options.requestHeaders) {
					if (hasOwnProp.call(options.requestHeaders,i) && typeof options.requestHeaders[i] === "string" && options.requestHeaders[i] !== "") {
						xhr.setRequestHeader(i,options.requestHeaders[i]);
					}
				}
			}

			/*
				Assign callbacks
				xmlhttprequest2 supports:
				* onloadstart
				* onprogress
				* onabort
				* onerror
				* onload
				* ontimeout
				* onloadend
				*/
			if (data.callbacks instanceof Object) {
				for (i in data.callbacks) {
					if (typeof data.callbacks[i] === "function") {
						xhr[i] = data.callbacks[i];
					}
				}
			}

			/* pass params to send for POSTs.  Ignored for GETs */
			xhr.send(params);

			return xhr;
		};
	}

	/***
	 * API endpoint class
	 * params:
	 	* api object - endpoint owner
		* options: includes endpoint path and configurations for each method type
	 ***/
	function EndPoint(api, options) {
		this.api = api;
		this.options = {
			pathTemplate: "",
			requestHeaders: {}
		};
		extend(this.options, options);

		/* Allow API to define default requestHeaders that are not defined in the endpoint config */
		if (api.options.requestHeaders !== undefined) {
			extend(this.options.requestHeaders, api.options.requestHeaders, false);
		}

	}

	/* getURL
	 * Merge pathTemplate string with urlData to create the endpoint path.
	 * calls api.getURL with endpoint path to generate full URL
	 * param: urlData - object containing kay/val pairs where keys match members of templateParams array
	*/
	EndPoint.prototype.getURL = function(urlData) {
		var i,
			path = this.options.pathTemplate;

		if (urlData instanceof Object && this.options.templateParams instanceof Array) {
			for (i=0; i<this.options.templateParams.length; i++) {
				path = path.replace(/%s/, urlData[this.options.templateParams[i]]);
			}
		}

		return this.api.getURL(path);
	};

	/***
	 * API parent class
	 * 
	 * params: name, domain and path
	 * all endpiont methods are added as children of API instance
	 ***/
	function API(options) {
		var i;
		this.methodTypes = methodTypes;
		this.options = {
			apiName: "api" + new Date().getTime(),
			domain: "",
			path: "/",
			methodTypes: [],
			requestHeaders: {}
		};
		extend(this.options, options);


		/*
			Handle non-CRUD method types by adding new method handlers to EndPoint Class
		*/

		if (this.options.methodTypes instanceof Array && this.options.methodTypes.length > 0) {
			
			for (i=0;i<this.options.methodTypes.length;i++) {

				/* add method type to internal list of methodTypes  */
				this.methodTypes[this.options.methodTypes[i]] = true;

				/* Create new prototype method */
				if (EndPoint.prototype[this.options.methodTypes[i]] === undefined) {
					EndPoint.prototype[this.options.methodTypes[i]] = EndPointMethodFactory(this.options.methodTypes[i]);
				}
			}
		}
	}

	/* getURL:
	 * assemble endpoint url from api domain, api path and endpoint path
	 * param: endpoint path
	 */
	API.prototype.getURL = function(epURL) {
		var url = this.options.domain + "/" + this.options.path,
			protocol = this.protocol || "http";
		if (epURL != undefined && epURL != "") {
			url += "/" + epURL;
		}
		url = url.replace(/\/{2,}/,"\/");
		return protocol + "://" + url;

	};

	/* add:
	 * add a new endpoint
	 * params:
	 	* name
		* options: includes endpoint path and configurations for each method type
	 */
	API.prototype.add = function(name, options) {
		var method, func;
		this[name] = new EndPoint(this, options);

		/* check for the alias option and alias endpoint methods directly on the API */
		for (method in this.methodTypes) {
			if (options[method] !== undefined &&
				options[method].alias !== undefined &&
				typeof options[method].alias === "string") {

				func = this[name][method];
				this[options[method].alias.replace(/\s+/g,'')] = function() {
					func.apply(this[name],arguments);
				}

			}
		}
	};

	/*
	 * createAPI
	 * Init a new API object and add it to the api map.
	 * Requires a valid JSON containing endpoints
	 */
	function createAPI(config) {
		var api, name;

		if (typeof config === "string") {
			config = JSON.parse(config);
		}

		if (typeof config !== "object" || !hasOwnProp.call(config,"endpoints")) {
			throw "Error: API config must be a valid JSON object";
		}

		/* init api object & add to apis map */
		api = new API(config.options);
		apiMap[api.options.apiName] = api;


		/* generate api endpoints */
		for (name in config.endpoints) {
			if (hasOwnProp.call(config.endpoints,name)) {
				try {
					api.add(name, config.endpoints[name]);
				} catch (e) { console.log(e); }
			}
		}

		return api;
	}

	/* Create CRUD methods */
	for (methodType in methodTypes) {
		if (hasOwnProp.call(methodTypes, methodType)) {
			EndPoint.prototype[methodType] = EndPointMethodFactory(methodType);
		}
	}

	/* EXPOSE PUBLIC MEMBERS */
	return {
		apis: apiMap,
		create: createAPI
	};

}());
