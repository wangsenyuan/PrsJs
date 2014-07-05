/*
 * author: wangsenyuan
 * email: wang.senyuan@gmail.com
 * */

(function($) {

	var RU = "RUNNING";
	var SU = "SUCCESS";
	var FL = "FAIL";

	function Promise(fn /* (resolve, reject) => Unit */) {
		if (this instanceof arguments.callee) {
			var p = {
				success : [],
				error : [],
				result : null,
				status : RU,
				on : function(label, fn) {
					if (this.status == RU) {
						if (label == "success") {
							this.success.push(fn);
						} else if (label == "error") {
							this.error.push(fn);
						}
					} else if (this.status == SU && label == "success") {
						fn(this.result);
					} else if (this.status == FL && label == "error") {
						fn(this.result);
					}
					return this;
				},
				_resolve : function(a) {
					if (this.status == SU) {
						return;
					}
					this.status = SU;
					this.result = a;
					for (var i = 0; i < this.success.length; i++) {
						this.success[i](a);
					}
				},
				_reject : function(e) {
					if (this.status == FL) {
						return;
					}
					this.status = FL;
					this.result = e;
					for (var i = 0; i < this.error.length; i++) {
						this.error[i](e);
					}
				},
				flatMap : function(fn /* A => Promise */) {
					var self = this;

					var p = new Promise(function(rx, rj) {
						self.on("error", function(e) {
							rj(e);
						});
						self.on("success", function(a) {
							var y = fn(a);
							y.on("success", function(b) {
								rx(b);
							});
							y.on("error", function(e) {
								rj(e);
							});
						});
					});

					return p;
				},
				map : function(fn /* A => B */) {
					var self = this;

					return new Promise(function(rx, rj) {
						self.on("error", function(e) {
							rj(e);
						});
						self.on("success", function(a) {
							rx(fn(a));
						});
					});
				},
				filter : function(fn /* A => Boolean */) {
					var self = this;
					return new Promise(function(rx, rj) {
						self.on("error", function(e) {
							rj(e);
						});
						self.on("success", function(a) {
							if (fn(a)) {
								rx(a);
							}
						});
					});
				},
			};
			fn.call(p, function(a) {
				p._resolve.call(p, a)
			}, function(e) {
				p._reject.call(p, e)
			});
			return p;
		} else {
			return new Promise(fn);
		}
	}

	Promise.unit = function(a) {
		return new Promise(function(resolve, reject) {
			try {
				resolve(a);
			} catch (e) {
				reject(e);
			}
		});
	};

	Promise.map2 = function(pa /* Promise */, pb /* Promise */, fn/*
																	 * (A, B) =>
																	 * C
																	 */) {
		return pa.flatMap(function(a) {
			return pb.map(function(b) {
				return fn(a, b);
			});
		});
	};

	Promise.all = function(ps /* Array Of Promise */) {
		if (ps.length == 0) {
			return null;
		} else if (ps.length == 1) {
			return ps[0].map(function(a) {
				return [ a ];
			});
		} else {
			var mid = ps.length / 2;
			var pre = ps.slice(0, mid);
			var post = ps.slice(mid);
			return Promise.map2(Promise.all(pre), Promise.all(post), function(
					a, b) {
				if (a != null) {
					return a.concat(b);
				} else {
					return b;
				}
			});
		}
	};

	Promise.foldLeft = function(ps, z, op) {
		if (ps.length == 0) {
			return Promise.unit(z);
		} else if (ps.length == 1) {
			return Promise.map2(Promise.unit(z), ps[0], function(a, b) {
				return op(a, b);
			});
		} else {
			var head = ps[0];
			var tail = ps.slice(1);
			return head.flatMap(function(a) {
				return Promise.foldLeft(tail, op(z, a), op);
			});
		}
	}
	$.Promise = Promise;
})(window);
