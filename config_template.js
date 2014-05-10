/* API Config Template */

window.API_CONFIG = window.API_CONFIG || {};
window.API_CONFIG.api1 = {
	"options": {
		"apiName": "API1",
		"domain": "localhost",
		"path": "api1"				//prepend this value to the endpoint path
	},
	"endpoints": {
		"endpoint1": {
			"pathTemplate":"/crud/%s",
			"templateParams": ["urlparam"],
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
};

window.API_CONFIG.api2 = {
	"options": {
		"apiName": "API2",
		"domain": "domain-for-api2.com",
		"path": "api2",
		"methodTypes":["stream"]	//optional array of endpoint methods to use in addition to CRUD methods
	},
	"endpoints": {
		"stream": {
			"pathTemplate":"/stream",
			"stream": {
				"myoption": 1
			}
		}
	}
};



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