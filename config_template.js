/* Example API Config */

(function() {
	window.MYAPIS = window.MYAPIS || {};
	window.MYAPIS.api1 = JSAPI.create({
		"options": {
			"apiName": "API1",
			"domain": "localhost",
			"path": "api1"				//prepend this value to the endpoint path
		},
		"endpoints": {
			"endpoint1": {
				"pathTemplate":"/crud/%s",
				"templateParams": ["urlparam"],
				"requestHeaders": {
					"Content-type": "application/rtf",	//override the content-type by default
					"Authentication": ""				//require Authentication header
				},
				"update": {
					"method": "POST",
					"params": ["updateParam1", "updateParam2"]
				},
				"read": {
					"method": "GET",
					"params": ["readParam1", "readParam2"]
				}
			},
			"endpoint2": {
				"pathTemplate":"/crud/ep2",
				"create": {
					"method": "POST",
					"params": ["createParam1", "createParam2"]
				},
				"read": {
					"method": "GET",
					"params": ["readParam1", "readParam2"]
				},
				"delete": {
					"method": "DELETE",
					"params": []
				}
			}
		}
	});

	window.MYAPIS.api2 = JSAPI.create({
		"options": {
			"apiName": "API2",
			"protocol": "https",
			"domain": "domain-for-api2.com",
			"path": "api2"
		},
		"endpoints": {
			"stream": {
				"pathTemplate":"/stream",
				"stream": {  // will map method to window.MYAPIS.api2.stream();
					"method": "STREAM",
					"callbacks": {

					}
				}
			}
		}
	});

}());


/*

		"": {
			"pathTemplate":"/",
			"update": {
				"method":"POST"
				
			},
			"read": {
				"method":"GET"
				
			},
			"delete": {
				
			}
		}
*/