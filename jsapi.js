/***
 * JSAPI v0.2 (https://github.com/nherman/jsapi)
 * MIT License: https://github.com/nherman/jsapi/blob/master/LICENSE
 ***/
;
window.JSAPI = window.JSAPI || (function() {
	"use strict";

	var 

		methodType,

		/* map containing all loaded apis */
		apiMap = {},

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


	/* stream
	 * Server Sent Events endpoint method - initiates an eventsource stream
	 * param: data = {
	 *		callbacks: {}
	 * }
	 */
	EndPoint.prototype.eventSource = function(type, data) {
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

	/* http
	 * makes a call to an http endpoint method
	 * e.g. api.endpoint.read({
	 * 			paramData: {},
	 *			urlData: {},
	 * 			headerData: {}
	 * 		});
	 */
	EndPoint.prototype.http = function(type, data) {
		var xhr,i,
			options = this.options[type],
			headers={},
			paramArray=[],
			payload="",
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
			Request Headers
		*/

		/* always assign a content-type header... unless we're uploading a file, see below */
		if (options.method === "GET") {
			headers["Content-Type"] = "application/json";
		} else {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
		}

		/* helper function for setting default headers */
		function setHeaders(defaultHeaders) {
			if (defaultHeaders instanceof Object) {
				for (i in defaultHeaders) {
					if (hasOwnProp.call(defaultHeaders,i)) {
						headers[i] = defaultHeaders[i];
					}
				}
			}
		}

		/*
			assign endpoint/api-specific request headers.
			this.options.requestHeaders => request header from api and endpoint configuration
		*/
		setHeaders(this.options.requestHeaders);

		/*
			Assign method request headers
			options.requestHeaders => request headers from method configuration
		*/
		setHeaders(options.requestHeaders);

		/* assign user defined headers */
		setHeaders(data.headerData);


		if (data.paramData !== undefined && data.paramData instanceof Object && options.params instanceof Array ) {
			if (headers["Content-Type"] === "multipart/form-data") {

				/*
					For multipart uploads use FormData object
				*/
				payload = new FormData();
				for (i=0; i<options.params.length; i++) {
					if (data.paramData[options.params[i]] !== undefined) {
						payload.append(options.params[i], data.paramData[options.params[i]]);
					}
				}

				/* allow FormData to set the Content-Type automatically for multipart/form-data submisions */
				delete headers["Content-Type"];

			} else {

				/* 
					For all other content-types join parameter data into a query string.
					Append to the URL if we're making a GET request
				*/

				for (i=0; i<options.params.length; i++) {
					if (data.paramData[options.params[i]] !== undefined) {
						paramArray.push(options.params[i] + "=" + encodeURIComponent(data.paramData[options.params[i]]));
					}
				}
				payload = paramArray.join("&");

				if (options.method === "GET" && payload.length > 0) {
					url += "?" + payload;
				}
			}
		}

		/* 
		 * Instantiate and configure the XHR object
		 */
		xhr = getXHR();
		xhr.open(options.method, url);


		/* set headers on xhr */
		for (i in headers) {
			if (hasOwnProp.call(headers,i) && typeof headers[i] === "string") {
				if (headers[i] === "") {
					console.log("Error. Required request header missing: " + i);
				} else {
					xhr.setRequestHeader(i,headers[i]);
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

		/* pass payload to send for POSTs.  Ignored for GETs */
		xhr.send(payload);

		return xhr;
	};

	/***
	 * API parent class
	 * 
	 * params: name, domain and path
	 * all endpiont methods are added as children of API instance
	 ***/
	function API(options) {
		var i;
		this.options = {
			apiName: "api" + new Date().getTime(),
			domain: "",
			path: "/",
			requestHeaders: {}
		};
		extend(this.options, options);
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
		var methodType,
			func,
			ep,
			reservedWords="http|eventSource|method|pathTemplate|templateParams|requestHeaders",
			isOverride=false;

		function streamMethodFactory(context, type) {
			return function(data) {
				return context.eventSource(type,data);
			}
		}

		function httpMethodFactory(context, type) {
			return function(data) {
				return context.http(type,data);
			};
		}

		/* instantiate endpoint */
		ep = new EndPoint(this, options);

		/* find all methods to attach to endpoint */
		for (methodType in options) {
			if (hasOwnProp.call(options, methodType) && 
				reservedWords.indexOf(methodType) < 0 &&
				options[methodType] instanceof Object &&
				options[methodType].method !== undefined) {

				if (name === methodType) {
					isOverride = true;
				}

				if (options[methodType].method.toUpperCase() === "STREAM") {
					ep[methodType] = streamMethodFactory(ep, methodType);
				} else {
					ep[methodType] = httpMethodFactory(ep, methodType);
				}

			}
		}

		/* attach endpoint to api.
			if endpoint contains a method that has the same name as the endpoint then
			attach it to the api where the endpoint would normally go.

			e.g. api.endpiont.endpoint() becomes api.endpoint()
		*/
		if (isOverride) {
			this[name+"_hidden"] = ep;
			this[name] = function() {
				ep[name].apply(ep, arguments);
			}
		} else {
			this[name] = ep;
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

	/* EXPOSE PUBLIC MEMBERS */
	return {
		apis: apiMap,
		create: createAPI
	};

}());
