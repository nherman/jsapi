jsapi
=====

Generate Javascript methods that correspond to API endpoints

Initializes API objects and stores them in a globally accessible map object
called window.JSAPI.apis.  Each API consists of a collection of Endpoints.

Usage:

	var newAPI = window.JSAPI.create(APIConfiguration);
	newAPI.endPointName.read({
		headerData: {
			"Request-header": "headervalue"
		},
		urlData: {
			"url1": "data"
		},
		paramData: {
			"param1": "data"
		},
		callbacks: {
			"onload": function() {},
			"onerror": function() {}
		}
	})

	APIConfiguration must be a JSON object that defines each endpoint in the API in this format:
	{
		"options": {
			"apiName": "APIContent",
			"domain": "localhost",
			"path": "api",
			"requestHeaders": {
				"required header name": "default value"
			}
		},
		"endpoints": {
			"endpoint1": {
				"pathTemplate":"",
				"templateParams": [],
				"requestHeaders": {
					"required header name": "default value overrides api defaults"
				}
				"update": {
					"requestHeaders": {
						"required header name": "default value overrides endpoint defaults"
					},
					"method": "POST",
					"params": []
				},
				"read": {
					"method": "GET"
				},
				"delete": {
					"method": "DELETE",
					"params": []
				}
			},
			"endpoint2": {
				"pathTemplate":"",
				/* if method name equals endpoint name then the endpoint becomes the functions: api.endpoint2();
				"endpoint2": {
					method:"STREAM",	//stream method for Server Sent Events
					callbacks: {
						onload: function() {}
					}
				}
			}
		}
	}