PrsJs
=====

A simple implementation of Promise pattern for JavaScript 

					function request(url) {
						return new Promise(function(resolve, reject) {
							$.ajax({
								"url" : url,
								success : function(response) {
									resolve(response);
								},
								error : function(xhr, status, e) {
									reject(e);
								}
							})
						});
					}

					var requesta = request("/fun/test/hello");

					var requestc = request("/fun/test/world");

					Promise.map2(requesta, requestc, function(a, c) {
						return (a + "----" + c);
					}).on("success", function(x) {
						console.log(x);
					});

					var all = Promise.all([ requesta, requestc ]).on("success",
							function(x) {
								console.log(x);
							});

					var goodbye = all.flatMap(function(x) {
						console.log("after all return get >>>" + x);
						console.log("call goodBye");
						return request("/fun/test/goodbye");
					});

					goodbye.on("success", function(x) {
						console.log("goodbye ? >>>" + x);
					});

					var fd = Promise.foldLeft([ requesta, requestc, goodbye ], [],
							function(array, x) {
								array.push(x);
								return array;
							});
					fd.on("success", function(x) {
						console.log("foldLeft called get >>>" + x);
					});
