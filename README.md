jsapi
=====

Generate Javascript methods that correspond to API endpoints

Initializes API objects and stores them in a globally accessible map object
called window.JSAPI.apis.  Each API consists of a collection of Endpoints.
Each Endpoint contains four default methods: create(), read(), update(), delete().

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
			"methodTypes":[] //optional array of endpoint methods to use in addition to CRUD methods
		},
		"endpoints": {
			"endpoint1": {
				"pathTemplate":"",
				"templateParams": [],
				"update": {
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
			}
		}
	}