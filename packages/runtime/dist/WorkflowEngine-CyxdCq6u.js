var ce = Object.defineProperty;
var ue = (n, t, e) => t in n ? ce(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var p = (n, t, e) => ue(n, typeof t != "symbol" ? t + "" : t, e);
var W = function(n, t) {
  return W = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, r) {
    e.__proto__ = r;
  } || function(e, r) {
    for (var i in r) Object.prototype.hasOwnProperty.call(r, i) && (e[i] = r[i]);
  }, W(n, t);
};
function g(n, t) {
  if (typeof t != "function" && t !== null)
    throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
  W(n, t);
  function e() {
    this.constructor = n;
  }
  n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
}
function le(n, t, e, r) {
  function i(o) {
    return o instanceof e ? o : new e(function(s) {
      s(o);
    });
  }
  return new (e || (e = Promise))(function(o, s) {
    function a(f) {
      try {
        u(r.next(f));
      } catch (h) {
        s(h);
      }
    }
    function c(f) {
      try {
        u(r.throw(f));
      } catch (h) {
        s(h);
      }
    }
    function u(f) {
      f.done ? o(f.value) : i(f.value).then(a, c);
    }
    u((r = r.apply(n, t || [])).next());
  });
}
function X(n, t) {
  var e = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, r, i, o, s = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return s.next = a(0), s.throw = a(1), s.return = a(2), typeof Symbol == "function" && (s[Symbol.iterator] = function() {
    return this;
  }), s;
  function a(u) {
    return function(f) {
      return c([u, f]);
    };
  }
  function c(u) {
    if (r) throw new TypeError("Generator is already executing.");
    for (; s && (s = 0, u[0] && (e = 0)), e; ) try {
      if (r = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done) return o;
      switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
        case 0:
        case 1:
          o = u;
          break;
        case 4:
          return e.label++, { value: u[1], done: !1 };
        case 5:
          e.label++, i = u[1], u = [0];
          continue;
        case 7:
          u = e.ops.pop(), e.trys.pop();
          continue;
        default:
          if (o = e.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
            e = 0;
            continue;
          }
          if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
            e.label = u[1];
            break;
          }
          if (u[0] === 6 && e.label < o[1]) {
            e.label = o[1], o = u;
            break;
          }
          if (o && e.label < o[2]) {
            e.label = o[2], e.ops.push(u);
            break;
          }
          o[2] && e.ops.pop(), e.trys.pop();
          continue;
      }
      u = t.call(n, e);
    } catch (f) {
      u = [6, f], i = 0;
    } finally {
      r = o = 0;
    }
    if (u[0] & 5) throw u[1];
    return { value: u[0] ? u[1] : void 0, done: !0 };
  }
}
function E(n) {
  var t = typeof Symbol == "function" && Symbol.iterator, e = t && n[t], r = 0;
  if (e) return e.call(n);
  if (n && typeof n.length == "number") return {
    next: function() {
      return n && r >= n.length && (n = void 0), { value: n && n[r++], done: !n };
    }
  };
  throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function T(n, t) {
  var e = typeof Symbol == "function" && n[Symbol.iterator];
  if (!e) return n;
  var r = e.call(n), i, o = [], s;
  try {
    for (; (t === void 0 || t-- > 0) && !(i = r.next()).done; ) o.push(i.value);
  } catch (a) {
    s = { error: a };
  } finally {
    try {
      i && !i.done && (e = r.return) && e.call(r);
    } finally {
      if (s) throw s.error;
    }
  }
  return o;
}
function O(n, t, e) {
  if (e || arguments.length === 2) for (var r = 0, i = t.length, o; r < i; r++)
    (o || !(r in t)) && (o || (o = Array.prototype.slice.call(t, 0, r)), o[r] = t[r]);
  return n.concat(o || Array.prototype.slice.call(t));
}
function S(n) {
  return this instanceof S ? (this.v = n, this) : new S(n);
}
function fe(n, t, e) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var r = e.apply(n, t || []), i, o = [];
  return i = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), a("next"), a("throw"), a("return", s), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function s(l) {
    return function(y) {
      return Promise.resolve(y).then(l, h);
    };
  }
  function a(l, y) {
    r[l] && (i[l] = function(d) {
      return new Promise(function(w, _) {
        o.push([l, d, w, _]) > 1 || c(l, d);
      });
    }, y && (i[l] = y(i[l])));
  }
  function c(l, y) {
    try {
      u(r[l](y));
    } catch (d) {
      b(o[0][3], d);
    }
  }
  function u(l) {
    l.value instanceof S ? Promise.resolve(l.value.v).then(f, h) : b(o[0][2], l);
  }
  function f(l) {
    c("next", l);
  }
  function h(l) {
    c("throw", l);
  }
  function b(l, y) {
    l(y), o.shift(), o.length && c(o[0][0], o[0][1]);
  }
}
function he(n) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var t = n[Symbol.asyncIterator], e;
  return t ? t.call(n) : (n = typeof E == "function" ? E(n) : n[Symbol.iterator](), e = {}, r("next"), r("throw"), r("return"), e[Symbol.asyncIterator] = function() {
    return this;
  }, e);
  function r(o) {
    e[o] = n[o] && function(s) {
      return new Promise(function(a, c) {
        s = n[o](s), i(a, c, s.done, s.value);
      });
    };
  }
  function i(o, s, a, c) {
    Promise.resolve(c).then(function(u) {
      o({ value: u, done: a });
    }, s);
  }
}
function v(n) {
  return typeof n == "function";
}
function ee(n) {
  var t = function(r) {
    Error.call(r), r.stack = new Error().stack;
  }, e = n(t);
  return e.prototype = Object.create(Error.prototype), e.prototype.constructor = e, e;
}
var U = ee(function(n) {
  return function(e) {
    n(this), this.message = e ? e.length + ` errors occurred during unsubscription:
` + e.map(function(r, i) {
      return i + 1 + ") " + r.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = e;
  };
});
function j(n, t) {
  if (n) {
    var e = n.indexOf(t);
    0 <= e && n.splice(e, 1);
  }
}
var I = function() {
  function n(t) {
    this.initialTeardown = t, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return n.prototype.unsubscribe = function() {
    var t, e, r, i, o;
    if (!this.closed) {
      this.closed = !0;
      var s = this._parentage;
      if (s)
        if (this._parentage = null, Array.isArray(s))
          try {
            for (var a = E(s), c = a.next(); !c.done; c = a.next()) {
              var u = c.value;
              u.remove(this);
            }
          } catch (d) {
            t = { error: d };
          } finally {
            try {
              c && !c.done && (e = a.return) && e.call(a);
            } finally {
              if (t) throw t.error;
            }
          }
        else
          s.remove(this);
      var f = this.initialTeardown;
      if (v(f))
        try {
          f();
        } catch (d) {
          o = d instanceof U ? d.errors : [d];
        }
      var h = this._finalizers;
      if (h) {
        this._finalizers = null;
        try {
          for (var b = E(h), l = b.next(); !l.done; l = b.next()) {
            var y = l.value;
            try {
              N(y);
            } catch (d) {
              o = o ?? [], d instanceof U ? o = O(O([], T(o)), T(d.errors)) : o.push(d);
            }
          }
        } catch (d) {
          r = { error: d };
        } finally {
          try {
            l && !l.done && (i = b.return) && i.call(b);
          } finally {
            if (r) throw r.error;
          }
        }
      }
      if (o)
        throw new U(o);
    }
  }, n.prototype.add = function(t) {
    var e;
    if (t && t !== this)
      if (this.closed)
        N(t);
      else {
        if (t instanceof n) {
          if (t.closed || t._hasParent(this))
            return;
          t._addParent(this);
        }
        (this._finalizers = (e = this._finalizers) !== null && e !== void 0 ? e : []).push(t);
      }
  }, n.prototype._hasParent = function(t) {
    var e = this._parentage;
    return e === t || Array.isArray(e) && e.includes(t);
  }, n.prototype._addParent = function(t) {
    var e = this._parentage;
    this._parentage = Array.isArray(e) ? (e.push(t), e) : e ? [e, t] : t;
  }, n.prototype._removeParent = function(t) {
    var e = this._parentage;
    e === t ? this._parentage = null : Array.isArray(e) && j(e, t);
  }, n.prototype.remove = function(t) {
    var e = this._finalizers;
    e && j(e, t), t instanceof n && t._removeParent(this);
  }, n.EMPTY = function() {
    var t = new n();
    return t.closed = !0, t;
  }(), n;
}(), te = I.EMPTY;
function re(n) {
  return n instanceof I || n && "closed" in n && v(n.remove) && v(n.add) && v(n.unsubscribe);
}
function N(n) {
  v(n) ? n() : n.unsubscribe();
}
var de = {
  Promise: void 0
}, pe = {
  setTimeout: function(n, t) {
    for (var e = [], r = 2; r < arguments.length; r++)
      e[r - 2] = arguments[r];
    return setTimeout.apply(void 0, O([n, t], T(e)));
  },
  clearTimeout: function(n) {
    return clearTimeout(n);
  },
  delegate: void 0
};
function ne(n) {
  pe.setTimeout(function() {
    throw n;
  });
}
function H() {
}
function P(n) {
  n();
}
var L = function(n) {
  g(t, n);
  function t(e) {
    var r = n.call(this) || this;
    return r.isStopped = !1, e ? (r.destination = e, re(e) && e.add(r)) : r.destination = be, r;
  }
  return t.create = function(e, r, i) {
    return new C(e, r, i);
  }, t.prototype.next = function(e) {
    this.isStopped || this._next(e);
  }, t.prototype.error = function(e) {
    this.isStopped || (this.isStopped = !0, this._error(e));
  }, t.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, t.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, n.prototype.unsubscribe.call(this), this.destination = null);
  }, t.prototype._next = function(e) {
    this.destination.next(e);
  }, t.prototype._error = function(e) {
    try {
      this.destination.error(e);
    } finally {
      this.unsubscribe();
    }
  }, t.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, t;
}(I), ye = function() {
  function n(t) {
    this.partialObserver = t;
  }
  return n.prototype.next = function(t) {
    var e = this.partialObserver;
    if (e.next)
      try {
        e.next(t);
      } catch (r) {
        B(r);
      }
  }, n.prototype.error = function(t) {
    var e = this.partialObserver;
    if (e.error)
      try {
        e.error(t);
      } catch (r) {
        B(r);
      }
    else
      B(t);
  }, n.prototype.complete = function() {
    var t = this.partialObserver;
    if (t.complete)
      try {
        t.complete();
      } catch (e) {
        B(e);
      }
  }, n;
}(), C = function(n) {
  g(t, n);
  function t(e, r, i) {
    var o = n.call(this) || this, s;
    return v(e) || !e ? s = {
      next: e ?? void 0,
      error: r ?? void 0,
      complete: i ?? void 0
    } : s = e, o.destination = new ye(s), o;
  }
  return t;
}(L);
function B(n) {
  ne(n);
}
function ve(n) {
  throw n;
}
var be = {
  closed: !0,
  next: H,
  error: ve,
  complete: H
}, F = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}();
function me(n) {
  return n;
}
function ge(n) {
  return n.length === 0 ? me : n.length === 1 ? n[0] : function(e) {
    return n.reduce(function(r, i) {
      return i(r);
    }, e);
  };
}
var m = function() {
  function n(t) {
    t && (this._subscribe = t);
  }
  return n.prototype.lift = function(t) {
    var e = new n();
    return e.source = this, e.operator = t, e;
  }, n.prototype.subscribe = function(t, e, r) {
    var i = this, o = Se(t) ? t : new C(t, e, r);
    return P(function() {
      var s = i, a = s.operator, c = s.source;
      o.add(a ? a.call(o, c) : c ? i._subscribe(o) : i._trySubscribe(o));
    }), o;
  }, n.prototype._trySubscribe = function(t) {
    try {
      return this._subscribe(t);
    } catch (e) {
      t.error(e);
    }
  }, n.prototype.forEach = function(t, e) {
    var r = this;
    return e = q(e), new e(function(i, o) {
      var s = new C({
        next: function(a) {
          try {
            t(a);
          } catch (c) {
            o(c), s.unsubscribe();
          }
        },
        error: o,
        complete: i
      });
      r.subscribe(s);
    });
  }, n.prototype._subscribe = function(t) {
    var e;
    return (e = this.source) === null || e === void 0 ? void 0 : e.subscribe(t);
  }, n.prototype[F] = function() {
    return this;
  }, n.prototype.pipe = function() {
    for (var t = [], e = 0; e < arguments.length; e++)
      t[e] = arguments[e];
    return ge(t)(this);
  }, n.prototype.toPromise = function(t) {
    var e = this;
    return t = q(t), new t(function(r, i) {
      var o;
      e.subscribe(function(s) {
        return o = s;
      }, function(s) {
        return i(s);
      }, function() {
        return r(o);
      });
    });
  }, n.create = function(t) {
    return new n(t);
  }, n;
}();
function q(n) {
  var t;
  return (t = n ?? de.Promise) !== null && t !== void 0 ? t : Promise;
}
function we(n) {
  return n && v(n.next) && v(n.error) && v(n.complete);
}
function Se(n) {
  return n && n instanceof L || we(n) && re(n);
}
function Ee(n) {
  return v(n == null ? void 0 : n.lift);
}
function M(n) {
  return function(t) {
    if (Ee(t))
      return t.lift(function(e) {
        try {
          return n(e, this);
        } catch (r) {
          this.error(r);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function x(n, t, e, r, i) {
  return new xe(n, t, e, r, i);
}
var xe = function(n) {
  g(t, n);
  function t(e, r, i, o, s, a) {
    var c = n.call(this, e) || this;
    return c.onFinalize = s, c.shouldUnsubscribe = a, c._next = r ? function(u) {
      try {
        r(u);
      } catch (f) {
        e.error(f);
      }
    } : n.prototype._next, c._error = o ? function(u) {
      try {
        o(u);
      } catch (f) {
        e.error(f);
      } finally {
        this.unsubscribe();
      }
    } : n.prototype._error, c._complete = i ? function() {
      try {
        i();
      } catch (u) {
        e.error(u);
      } finally {
        this.unsubscribe();
      }
    } : n.prototype._complete, c;
  }
  return t.prototype.unsubscribe = function() {
    var e;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var r = this.closed;
      n.prototype.unsubscribe.call(this), !r && ((e = this.onFinalize) === null || e === void 0 || e.call(this));
    }
  }, t;
}(L), Me = ee(function(n) {
  return function() {
    n(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
  };
}), D = function(n) {
  g(t, n);
  function t() {
    var e = n.call(this) || this;
    return e.closed = !1, e.currentObservers = null, e.observers = [], e.isStopped = !1, e.hasError = !1, e.thrownError = null, e;
  }
  return t.prototype.lift = function(e) {
    var r = new V(this, this);
    return r.operator = e, r;
  }, t.prototype._throwIfClosed = function() {
    if (this.closed)
      throw new Me();
  }, t.prototype.next = function(e) {
    var r = this;
    P(function() {
      var i, o;
      if (r._throwIfClosed(), !r.isStopped) {
        r.currentObservers || (r.currentObservers = Array.from(r.observers));
        try {
          for (var s = E(r.currentObservers), a = s.next(); !a.done; a = s.next()) {
            var c = a.value;
            c.next(e);
          }
        } catch (u) {
          i = { error: u };
        } finally {
          try {
            a && !a.done && (o = s.return) && o.call(s);
          } finally {
            if (i) throw i.error;
          }
        }
      }
    });
  }, t.prototype.error = function(e) {
    var r = this;
    P(function() {
      if (r._throwIfClosed(), !r.isStopped) {
        r.hasError = r.isStopped = !0, r.thrownError = e;
        for (var i = r.observers; i.length; )
          i.shift().error(e);
      }
    });
  }, t.prototype.complete = function() {
    var e = this;
    P(function() {
      if (e._throwIfClosed(), !e.isStopped) {
        e.isStopped = !0;
        for (var r = e.observers; r.length; )
          r.shift().complete();
      }
    });
  }, t.prototype.unsubscribe = function() {
    this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
  }, Object.defineProperty(t.prototype, "observed", {
    get: function() {
      var e;
      return ((e = this.observers) === null || e === void 0 ? void 0 : e.length) > 0;
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype._trySubscribe = function(e) {
    return this._throwIfClosed(), n.prototype._trySubscribe.call(this, e);
  }, t.prototype._subscribe = function(e) {
    return this._throwIfClosed(), this._checkFinalizedStatuses(e), this._innerSubscribe(e);
  }, t.prototype._innerSubscribe = function(e) {
    var r = this, i = this, o = i.hasError, s = i.isStopped, a = i.observers;
    return o || s ? te : (this.currentObservers = null, a.push(e), new I(function() {
      r.currentObservers = null, j(a, e);
    }));
  }, t.prototype._checkFinalizedStatuses = function(e) {
    var r = this, i = r.hasError, o = r.thrownError, s = r.isStopped;
    i ? e.error(o) : s && e.complete();
  }, t.prototype.asObservable = function() {
    var e = new m();
    return e.source = this, e;
  }, t.create = function(e, r) {
    return new V(e, r);
  }, t;
}(m), V = function(n) {
  g(t, n);
  function t(e, r) {
    var i = n.call(this) || this;
    return i.destination = e, i.source = r, i;
  }
  return t.prototype.next = function(e) {
    var r, i;
    (i = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || i === void 0 || i.call(r, e);
  }, t.prototype.error = function(e) {
    var r, i;
    (i = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || i === void 0 || i.call(r, e);
  }, t.prototype.complete = function() {
    var e, r;
    (r = (e = this.destination) === null || e === void 0 ? void 0 : e.complete) === null || r === void 0 || r.call(e);
  }, t.prototype._subscribe = function(e) {
    var r, i;
    return (i = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(e)) !== null && i !== void 0 ? i : te;
  }, t;
}(D), _e = function(n) {
  g(t, n);
  function t(e) {
    var r = n.call(this) || this;
    return r._value = e, r;
  }
  return Object.defineProperty(t.prototype, "value", {
    get: function() {
      return this.getValue();
    },
    enumerable: !1,
    configurable: !0
  }), t.prototype._subscribe = function(e) {
    var r = n.prototype._subscribe.call(this, e);
    return !r.closed && e.next(this._value), r;
  }, t.prototype.getValue = function() {
    var e = this, r = e.hasError, i = e.thrownError, o = e._value;
    if (r)
      throw i;
    return this._throwIfClosed(), o;
  }, t.prototype.next = function(e) {
    n.prototype.next.call(this, this._value = e);
  }, t;
}(D), ie = {
  now: function() {
    return (ie.delegate || Date).now();
  },
  delegate: void 0
}, ke = function(n) {
  g(t, n);
  function t(e, r) {
    return n.call(this) || this;
  }
  return t.prototype.schedule = function(e, r) {
    return this;
  }, t;
}(I), Y = {
  setInterval: function(n, t) {
    for (var e = [], r = 2; r < arguments.length; r++)
      e[r - 2] = arguments[r];
    return setInterval.apply(void 0, O([n, t], T(e)));
  },
  clearInterval: function(n) {
    return clearInterval(n);
  },
  delegate: void 0
}, Te = function(n) {
  g(t, n);
  function t(e, r) {
    var i = n.call(this, e, r) || this;
    return i.scheduler = e, i.work = r, i.pending = !1, i;
  }
  return t.prototype.schedule = function(e, r) {
    var i;
    if (r === void 0 && (r = 0), this.closed)
      return this;
    this.state = e;
    var o = this.id, s = this.scheduler;
    return o != null && (this.id = this.recycleAsyncId(s, o, r)), this.pending = !0, this.delay = r, this.id = (i = this.id) !== null && i !== void 0 ? i : this.requestAsyncId(s, this.id, r), this;
  }, t.prototype.requestAsyncId = function(e, r, i) {
    return i === void 0 && (i = 0), Y.setInterval(e.flush.bind(e, this), i);
  }, t.prototype.recycleAsyncId = function(e, r, i) {
    if (i === void 0 && (i = 0), i != null && this.delay === i && this.pending === !1)
      return r;
    r != null && Y.clearInterval(r);
  }, t.prototype.execute = function(e, r) {
    if (this.closed)
      return new Error("executing a cancelled action");
    this.pending = !1;
    var i = this._execute(e, r);
    if (i)
      return i;
    this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
  }, t.prototype._execute = function(e, r) {
    var i = !1, o;
    try {
      this.work(e);
    } catch (s) {
      i = !0, o = s || new Error("Scheduled action threw falsy error");
    }
    if (i)
      return this.unsubscribe(), o;
  }, t.prototype.unsubscribe = function() {
    if (!this.closed) {
      var e = this, r = e.id, i = e.scheduler, o = i.actions;
      this.work = this.state = this.scheduler = null, this.pending = !1, j(o, this), r != null && (this.id = this.recycleAsyncId(i, r, null)), this.delay = null, n.prototype.unsubscribe.call(this);
    }
  }, t;
}(ke), K = function() {
  function n(t, e) {
    e === void 0 && (e = n.now), this.schedulerActionCtor = t, this.now = e;
  }
  return n.prototype.schedule = function(t, e, r) {
    return e === void 0 && (e = 0), new this.schedulerActionCtor(this, t).schedule(r, e);
  }, n.now = ie.now, n;
}(), Oe = function(n) {
  g(t, n);
  function t(e, r) {
    r === void 0 && (r = K.now);
    var i = n.call(this, e, r) || this;
    return i.actions = [], i._active = !1, i;
  }
  return t.prototype.flush = function(e) {
    var r = this.actions;
    if (this._active) {
      r.push(e);
      return;
    }
    var i;
    this._active = !0;
    do
      if (i = e.execute(e.state, e.delay))
        break;
    while (e = r.shift());
    if (this._active = !1, i) {
      for (; e = r.shift(); )
        e.unsubscribe();
      throw i;
    }
  }, t;
}(K), Ce = new Oe(Te), De = Ce, Ie = function(n) {
  return n && typeof n.length == "number" && typeof n != "function";
};
function Re(n) {
  return v(n == null ? void 0 : n.then);
}
function Ae(n) {
  return v(n[F]);
}
function Be(n) {
  return Symbol.asyncIterator && v(n == null ? void 0 : n[Symbol.asyncIterator]);
}
function Pe(n) {
  return new TypeError("You provided " + (n !== null && typeof n == "object" ? "an invalid object" : "'" + n + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function je() {
  return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var ze = je();
function Ue(n) {
  return v(n == null ? void 0 : n[ze]);
}
function $e(n) {
  return fe(this, arguments, function() {
    var e, r, i, o;
    return X(this, function(s) {
      switch (s.label) {
        case 0:
          e = n.getReader(), s.label = 1;
        case 1:
          s.trys.push([1, , 9, 10]), s.label = 2;
        case 2:
          return [4, S(e.read())];
        case 3:
          return r = s.sent(), i = r.value, o = r.done, o ? [4, S(void 0)] : [3, 5];
        case 4:
          return [2, s.sent()];
        case 5:
          return [4, S(i)];
        case 6:
          return [4, s.sent()];
        case 7:
          return s.sent(), [3, 2];
        case 8:
          return [3, 10];
        case 9:
          return e.releaseLock(), [7];
        case 10:
          return [2];
      }
    });
  });
}
function We(n) {
  return v(n == null ? void 0 : n.getReader);
}
function z(n) {
  if (n instanceof m)
    return n;
  if (n != null) {
    if (Ae(n))
      return He(n);
    if (Ie(n))
      return Le(n);
    if (Re(n))
      return Fe(n);
    if (Be(n))
      return oe(n);
    if (Ue(n))
      return Ge(n);
    if (We(n))
      return Ne(n);
  }
  throw Pe(n);
}
function He(n) {
  return new m(function(t) {
    var e = n[F]();
    if (v(e.subscribe))
      return e.subscribe(t);
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function Le(n) {
  return new m(function(t) {
    for (var e = 0; e < n.length && !t.closed; e++)
      t.next(n[e]);
    t.complete();
  });
}
function Fe(n) {
  return new m(function(t) {
    n.then(function(e) {
      t.closed || (t.next(e), t.complete());
    }, function(e) {
      return t.error(e);
    }).then(null, ne);
  });
}
function Ge(n) {
  return new m(function(t) {
    var e, r;
    try {
      for (var i = E(n), o = i.next(); !o.done; o = i.next()) {
        var s = o.value;
        if (t.next(s), t.closed)
          return;
      }
    } catch (a) {
      e = { error: a };
    } finally {
      try {
        o && !o.done && (r = i.return) && r.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    t.complete();
  });
}
function oe(n) {
  return new m(function(t) {
    qe(n, t).catch(function(e) {
      return t.error(e);
    });
  });
}
function Ne(n) {
  return oe($e(n));
}
function qe(n, t) {
  var e, r, i, o;
  return le(this, void 0, void 0, function() {
    var s, a;
    return X(this, function(c) {
      switch (c.label) {
        case 0:
          c.trys.push([0, 5, 6, 11]), e = he(n), c.label = 1;
        case 1:
          return [4, e.next()];
        case 2:
          if (r = c.sent(), !!r.done) return [3, 4];
          if (s = r.value, t.next(s), t.closed)
            return [2];
          c.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          return a = c.sent(), i = { error: a }, [3, 11];
        case 6:
          return c.trys.push([6, , 9, 10]), r && !r.done && (o = e.return) ? [4, o.call(e)] : [3, 8];
        case 7:
          c.sent(), c.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (i) throw i.error;
          return [7];
        case 10:
          return [7];
        case 11:
          return t.complete(), [2];
      }
    });
  });
}
function Ve(n) {
  return n instanceof Date && !isNaN(n);
}
function Q(n, t) {
  return M(function(e, r) {
    var i = 0;
    e.subscribe(x(r, function(o) {
      r.next(n.call(t, o, i++));
    }));
  });
}
function Ye(n, t, e) {
  return n === void 0 && (n = 0), e === void 0 && (e = De), new m(function(r) {
    var i = Ve(n) ? +n - e.now() : n;
    i < 0 && (i = 0);
    var o = 0;
    return e.schedule(function() {
      r.closed || (r.next(o++), r.complete());
    }, i);
  });
}
function Z(n, t) {
  return M(function(e, r) {
    var i = 0;
    e.subscribe(x(r, function(o) {
      return n.call(t, o, i++) && r.next(o);
    }));
  });
}
function Ke(n) {
  return M(function(t, e) {
    var r = [];
    return t.subscribe(x(e, function(i) {
      return r.push(i);
    }, function() {
      e.next(r), e.complete();
    })), z(n).subscribe(x(e, function() {
      var i = r;
      r = [], e.next(i);
    }, H)), function() {
      r = null;
    };
  });
}
function se(n) {
  return M(function(t, e) {
    var r = null, i = !1, o;
    r = t.subscribe(x(e, void 0, void 0, function(s) {
      o = z(n(s, se(n)(t))), r ? (r.unsubscribe(), r = null, o.subscribe(e)) : i = !0;
    })), i && (r.unsubscribe(), r = null, o.subscribe(e));
  });
}
function Qe(n, t, e, r, i) {
  return function(o, s) {
    var a = e, c = t, u = 0;
    o.subscribe(x(s, function(f) {
      var h = u++;
      c = a ? n(c, f, h) : (a = !0, f), s.next(c);
    }, i));
  };
}
function Ze(n, t) {
  return M(Qe(n, t, arguments.length >= 2, !0));
}
function J(n) {
  n === void 0 && (n = {});
  var t = n.connector, e = t === void 0 ? function() {
    return new D();
  } : t, r = n.resetOnError, i = r === void 0 ? !0 : r, o = n.resetOnComplete, s = o === void 0 ? !0 : o, a = n.resetOnRefCountZero, c = a === void 0 ? !0 : a;
  return function(u) {
    var f, h, b, l = 0, y = !1, d = !1, w = function() {
      h == null || h.unsubscribe(), h = void 0;
    }, _ = function() {
      w(), f = b = void 0, y = d = !1;
    }, ae = function() {
      var k = f;
      _(), k == null || k.unsubscribe();
    };
    return M(function(k, G) {
      l++, !d && !y && w();
      var R = b = b ?? e();
      G.add(function() {
        l--, l === 0 && !d && !y && (h = $(ae, c));
      }), R.subscribe(G), !f && l > 0 && (f = new C({
        next: function(A) {
          return R.next(A);
        },
        error: function(A) {
          d = !0, w(), h = $(_, i, A), R.error(A);
        },
        complete: function() {
          y = !0, w(), h = $(_, s), R.complete();
        }
      }), z(k).subscribe(f));
    })(u);
  };
}
function $(n, t) {
  for (var e = [], r = 2; r < arguments.length; r++)
    e[r - 2] = arguments[r];
  if (t === !0) {
    n();
    return;
  }
  if (t !== !1) {
    var i = new C({
      next: function() {
        i.unsubscribe(), n();
      }
    });
    return z(t.apply(void 0, O([], T(e)))).subscribe(i);
  }
}
const Je = {
  bufferSize: 1e3,
  batchTimeout: 16,
  // ~60fps
  maxBatchSize: 50,
  backpressureThreshold: 0.8,
  retryAttempts: 3,
  retryDelay: 100
};
class Xe {
  constructor() {
    p(this, "connections", /* @__PURE__ */ new Map());
    p(this, "messageSubject", new D());
    p(this, "debugSubject", new D());
    p(this, "metricsSubject", new _e(/* @__PURE__ */ new Map()));
    p(this, "backpressureHandler");
    p(this, "errorRecovery");
    p(this, "metricsUpdateInterval");
    p(this, "debug$", this.debugSubject.asObservable().pipe(J()));
    p(this, "metrics$", this.metricsSubject.asObservable().pipe(J()));
    this.startMetricsCollection();
  }
  setBackpressureHandler(t) {
    this.backpressureHandler = t;
  }
  setErrorRecovery(t) {
    this.errorRecovery = t;
  }
  createConnection(t, e, r, i, o = {}) {
    const s = `${t}:${r}->${e}:${i}`, a = { ...Je, ...o };
    let c;
    const u = new ReadableStream({
      start(l) {
        c = l;
      },
      cancel() {
      }
    }, {
      highWaterMark: a.bufferSize,
      size: () => 1
    }), h = new WritableStream({
      write: async (l) => {
        try {
          await this.processMessage(l, s, c);
        } catch (y) {
          await this.handleError(y, s);
        }
      },
      close() {
        c == null || c.close();
      },
      abort(l) {
        c == null || c.error(l);
      }
    }, {
      highWaterMark: a.bufferSize,
      size: () => 1
    }).getWriter(), b = {
      id: s,
      sourceNodeId: t,
      targetNodeId: e,
      sourcePort: r,
      targetPort: i,
      stream: u,
      writer: h,
      config: a,
      metrics: this.createInitialMetrics()
    };
    return this.connections.set(s, b), this.debugEvent("message", s, { action: "connection_created" }), s;
  }
  async processMessage(t, e, r) {
    var s;
    const i = this.connections.get(e);
    if (!i) return;
    if ((r.desiredSize !== null ? (i.config.bufferSize - r.desiredSize) / i.config.bufferSize : 0) > i.config.backpressureThreshold && (await this.handleBackpressure(i), (s = this.backpressureHandler) != null && s.shouldDropMessage(t))) {
      this.debugEvent("backpressure", e, { action: "message_dropped", messageId: t.id });
      return;
    }
    r.enqueue(t), this.onMessage(t, e), this.messageSubject.next({ message: t, connectionId: e });
  }
  async handleBackpressure(t) {
    this.debugEvent("backpressure", t.id, {
      bufferUtilization: t.metrics.bufferUtilization
    }), t.metrics.backpressureEvents++, this.backpressureHandler && await this.backpressureHandler.onBackpressure(t);
  }
  async handleError(t, e) {
    const r = this.connections.get(e);
    r && (this.onError(t, e), this.debugEvent("error", e, { error: t.message, stack: t.stack }), this.errorRecovery && await this.errorRecovery.onError(t, r));
  }
  getConnection(t) {
    return this.connections.get(t);
  }
  closeConnection(t) {
    const e = this.connections.get(t);
    e && (e.writer.close(), this.connections.delete(t), this.debugEvent("message", t, { action: "connection_closed" }));
  }
  // Batching for UI updates
  createBatchedStream(t, e) {
    const r = this.connections.get(t);
    if (!r)
      throw new Error(`Connection ${t} not found`);
    const i = { ...r.config, ...e };
    return this.messageSubject.pipe(
      Z(({ connectionId: o }) => o === t),
      Q(({ message: o }) => o),
      Ke(Ye(i.batchTimeout)),
      Z((o) => o.length > 0),
      Q((o) => {
        const s = {
          messages: o.slice(0, i.maxBatchSize),
          totalSize: o.length,
          timestamp: Date.now()
        };
        return this.debugEvent("batch", t, {
          batchSize: s.messages.length,
          totalMessages: s.totalSize
        }), s;
      }),
      se((o) => (this.handleError(o, t), []))
    );
  }
  // Stream monitoring implementation
  onMessage(t, e) {
    const r = this.connections.get(e);
    if (!r) return;
    const i = Date.now(), o = i - t.timestamp;
    r.metrics.averageLatency = r.metrics.averageLatency * 0.9 + o * 0.1, r.metrics.lastUpdated = i;
  }
  onError(t, e) {
    const r = this.connections.get(e);
    r && (r.metrics.errorRate = r.metrics.errorRate * 0.95 + 0.05, r.metrics.lastUpdated = Date.now());
  }
  getMetrics(t) {
    var e;
    return (e = this.connections.get(t)) == null ? void 0 : e.metrics;
  }
  resetMetrics(t) {
    const e = this.connections.get(t);
    e && (e.metrics = this.createInitialMetrics(), this.debugEvent("metrics", t, { action: "metrics_reset" }));
  }
  createInitialMetrics() {
    return {
      messagesPerSecond: 0,
      averageLatency: 0,
      bufferUtilization: 0,
      backpressureEvents: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };
  }
  startMetricsCollection() {
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1e3), this.messageSubject.pipe(
      Ze((t, { connectionId: e }) => (t.set(e, (t.get(e) || 0) + 1), t), /* @__PURE__ */ new Map())
    ).subscribe((t) => {
      for (const [e, r] of t) {
        const i = this.connections.get(e);
        i && (i.metrics.messagesPerSecond = r);
      }
      t.clear();
    });
  }
  updateMetrics() {
    const t = /* @__PURE__ */ new Map();
    for (const [e, r] of this.connections)
      t.set(e, { ...r.metrics });
    this.metricsSubject.next(t);
  }
  debugEvent(t, e, r) {
    this.debugSubject.next({
      type: t,
      timestamp: Date.now(),
      connectionId: e,
      data: r
    });
  }
  destroy() {
    this.metricsUpdateInterval && clearInterval(this.metricsUpdateInterval);
    for (const t of this.connections.keys())
      this.closeConnection(t);
    this.messageSubject.complete(), this.debugSubject.complete(), this.metricsSubject.complete();
  }
}
class et {
  constructor(t = {
    dropThreshold: 0.9,
    priorityDrop: !0,
    maxWaitTime: 100
  }) {
    p(this, "priorityWeights", /* @__PURE__ */ new Map());
    this.options = t;
  }
  setPriorityWeight(t, e) {
    this.priorityWeights.set(t, e);
  }
  async onBackpressure(t) {
    const e = this.calculateBufferUtilization(t);
    e > this.options.dropThreshold ? (console.warn(`Severe backpressure on connection ${t.id}, buffer: ${e * 100}%`), await this.sleep(this.options.maxWaitTime)) : await this.sleep(10);
  }
  shouldDropMessage(t) {
    if (!this.options.priorityDrop)
      return !1;
    const e = this.prioritizeMessage(t), r = Math.max(0, 1 - e);
    return Math.random() < r;
  }
  prioritizeMessage(t) {
    var s;
    const e = this.priorityWeights.get(t.sourceNodeId) || 0.5, r = Date.now() - t.timestamp, i = Math.min(1, r / 1e3), o = ((s = t.metadata) == null ? void 0 : s.priority) || 0.5;
    return Math.min(1, e + i * 0.2 + o * 0.3);
  }
  calculateBufferUtilization(t) {
    return t.metrics.bufferUtilization;
  }
  sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
}
class nt {
  constructor() {
    p(this, "connectionStates", /* @__PURE__ */ new Map());
  }
  async onBackpressure(t) {
    const e = this.getConnectionState(t.id), r = Date.now(), i = r - e.lastBackpressure;
    i < 1e3 ? (e.adaptiveThreshold = Math.max(0.5, e.adaptiveThreshold - 0.05), e.dropRate = Math.min(0.8, e.dropRate + 0.1)) : i > 5e3 && (e.adaptiveThreshold = Math.min(0.9, e.adaptiveThreshold + 0.02), e.dropRate = Math.max(0.1, e.dropRate - 0.05)), e.lastBackpressure = r;
    const o = Math.min(200, 50 / e.adaptiveThreshold);
    await this.sleep(o);
  }
  shouldDropMessage(t) {
    const e = `${t.sourceNodeId}:${t.targetNodeId}`, r = this.getConnectionState(e);
    return Math.random() < r.dropRate;
  }
  prioritizeMessage(t) {
    var a;
    const e = {
      "ui-update": 0.3,
      "data-flow": 0.7,
      control: 0.9,
      error: 1
    }, r = ((a = t.metadata) == null ? void 0 : a.type) || "data-flow", i = e[r] || 0.5, o = Date.now() - t.timestamp, s = Math.min(0.5, o / 5e3);
    return Math.max(0, i - s);
  }
  getConnectionState(t) {
    return this.connectionStates.has(t) || this.connectionStates.set(t, {
      lastBackpressure: 0,
      adaptiveThreshold: 0.8,
      dropRate: 0.1
    }), this.connectionStates.get(t);
  }
  sleep(t) {
    return new Promise((e) => setTimeout(e, t));
  }
}
class it {
  constructor(t = {
    maxRetries: 3,
    baseRetryDelay: 100,
    maxRetryDelay: 5e3,
    exponentialBackoff: !0,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 3e4
  }) {
    p(this, "retryHistory", /* @__PURE__ */ new Map());
    this.options = t;
  }
  async onError(t, e) {
    const r = `${e.id}:${t.name}`, i = this.getErrorHistory(r);
    if (console.error(`Stream error on connection ${e.id}:`, t.message), this.shouldTriggerCircuitBreaker(i)) {
      console.warn(`Circuit breaker triggered for connection ${e.id}`), await this.triggerCircuitBreaker(e);
      return;
    }
    i.push(Date.now()), this.cleanupOldErrors(i);
  }
  shouldRetry(t, e) {
    if (e >= this.options.maxRetries || [
      "AbortError",
      "TypeError",
      // Usually indicates programming error
      "SyntaxError"
    ].includes(t.name))
      return !1;
    const i = `circuit-breaker:${t.name}`, o = this.getErrorHistory(i);
    if (o.length > 0) {
      const s = o[o.length - 1];
      if (s && Date.now() - s < this.options.circuitBreakerTimeout)
        return !1;
    }
    return !0;
  }
  getRetryDelay(t) {
    if (!this.options.exponentialBackoff)
      return this.options.baseRetryDelay;
    const e = this.options.baseRetryDelay * Math.pow(2, t);
    return Math.min(e, this.options.maxRetryDelay);
  }
  shouldTriggerCircuitBreaker(t) {
    if (t.length < this.options.circuitBreakerThreshold)
      return !1;
    const e = 6e4, r = Date.now();
    return t.filter((o) => r - o < e).length >= this.options.circuitBreakerThreshold;
  }
  async triggerCircuitBreaker(t) {
    const e = `circuit-breaker:${t.id}`;
    this.getErrorHistory(e).push(Date.now()), console.warn(`Circuit breaker open for connection ${t.id}, timeout: ${this.options.circuitBreakerTimeout}ms`);
  }
  getErrorHistory(t) {
    return this.retryHistory.has(t) || this.retryHistory.set(t, []), this.retryHistory.get(t);
  }
  cleanupOldErrors(t) {
    const e = Date.now() - 3e5, r = t.filter((i) => i > e);
    t.length = 0, t.push(...r);
  }
}
class tt {
  constructor() {
    p(this, "connectionStates", /* @__PURE__ */ new Map());
  }
  async onError(t, e) {
    const r = this.getConnectionState(e.id);
    r.lastError = Date.now(), r.errorCount++, r.errorCount > 2 && !r.degradedMode && await this.enterDegradedMode(e), this.isRecoverableError(t) && await this.attemptGracefulRecovery(e, t);
  }
  shouldRetry(t, e) {
    const r = this.isRecoverableError(t) ? 5 : 2;
    return e < r;
  }
  getRetryDelay(t) {
    const r = Math.random() * 100;
    return 200 * Math.pow(1.5, t) + r;
  }
  async enterDegradedMode(t) {
    const e = this.getConnectionState(t.id);
    e.degradedMode = !0, e.isHealthy = !1, console.warn(`Connection ${t.id} entering degraded mode`), t.config.batchTimeout = Math.min(t.config.batchTimeout * 2, 1e3), t.config.maxBatchSize = Math.max(t.config.maxBatchSize / 2, 1);
  }
  async attemptGracefulRecovery(t, e) {
    const r = this.getConnectionState(t.id);
    e.name === "QuotaExceededError" ? await this.clearOldData(t) : e.name === "NetworkError" ? await this.reduceMessageFrequency(t) : e.message.includes("backpressure") && (t.config.maxBatchSize = Math.min(t.config.maxBatchSize * 1.5, 200));
    const i = Date.now() - r.lastError;
    r.degradedMode && i > 3e4 && await this.exitDegradedMode(t);
  }
  async exitDegradedMode(t) {
    const e = this.getConnectionState(t.id);
    e.degradedMode = !1, e.isHealthy = !0, e.errorCount = 0, console.info(`Connection ${t.id} exiting degraded mode`), t.config.batchTimeout = 16, t.config.maxBatchSize = 50;
  }
  isRecoverableError(t) {
    return [
      "QuotaExceededError",
      "NetworkError",
      "TimeoutError",
      "DataCloneError"
    ].some(
      (r) => t.name === r || t.message.includes(r.toLowerCase())
    );
  }
  async clearOldData(t) {
    console.info(`Clearing old data for connection ${t.id}`);
  }
  async reduceMessageFrequency(t) {
    t.config.batchTimeout = Math.min(t.config.batchTimeout * 1.5, 500), console.info(`Reduced message frequency for connection ${t.id}`);
  }
  getConnectionState(t) {
    return this.connectionStates.has(t) || this.connectionStates.set(t, {
      isHealthy: !0,
      degradedMode: !1,
      lastError: 0,
      errorCount: 0
    }), this.connectionStates.get(t);
  }
}
class ot {
  constructor() {
    p(this, "nodeExecutors", /* @__PURE__ */ new Map());
    p(this, "runningWorkflows", /* @__PURE__ */ new Map());
    p(this, "streamEngine");
    p(this, "nodeDataStreams", /* @__PURE__ */ new Map());
    this.streamEngine = new Xe(), this.streamEngine.setBackpressureHandler(new et()), this.streamEngine.setErrorRecovery(new tt());
  }
  registerNodeExecutor(t) {
    this.nodeExecutors.set(t.type, t);
  }
  getStreamEngine() {
    return this.streamEngine;
  }
  async executeWorkflow(t) {
    const e = new AbortController();
    this.runningWorkflows.set(t.id, e);
    try {
      this.setupWorkflowStreams(t);
      const r = new Map(t.nodes.map((o) => [o.id, o])), i = this.topologicalSort(t);
      for (const o of i) {
        if (e.signal.aborted) break;
        const s = r.get(o);
        s && await this.executeNode(t.id, s);
      }
    } finally {
      this.cleanupWorkflowStreams(t.id), this.runningWorkflows.delete(t.id);
    }
  }
  stopWorkflow(t) {
    const e = this.runningWorkflows.get(t);
    e && e.abort();
  }
  async executeNode(t, e) {
    const r = this.nodeExecutors.get(e.type);
    if (!r)
      throw new Error(`No executor found for node type: ${e.type}`);
    const i = this.collectNodeInputs(t, e.id), o = {
      workflowId: t,
      nodeId: e.id,
      inputs: i,
      config: e.config,
      emitOutput: (s, a) => {
        this.forwardDataToConnectedNodes(t, e.id, s, a);
      },
      emitError: (s) => {
        console.error(`Node ${e.id} error:`, s);
      }
    };
    await r.execute(o);
  }
  topologicalSort(t) {
    const e = /* @__PURE__ */ new Set(), r = [], i = (o) => {
      if (e.has(o)) return;
      e.add(o);
      const s = t.edges.filter((a) => a.target === o).map((a) => a.source);
      for (const a of s)
        i(a);
      r.push(o);
    };
    for (const o of t.nodes)
      i(o.id);
    return r;
  }
  setupWorkflowStreams(t) {
    for (const e of t.edges) {
      const r = this.streamEngine.createConnection(
        e.source,
        e.target,
        e.sourcePort,
        e.targetPort,
        {
          bufferSize: 1e3,
          batchTimeout: 16,
          maxBatchSize: 50,
          backpressureThreshold: 0.8,
          retryAttempts: 3,
          retryDelay: 100
        }
      );
      this.nodeDataStreams.has(t.id) || this.nodeDataStreams.set(t.id, /* @__PURE__ */ new Map()), this.nodeDataStreams.get(t.id).set(e.id, r);
    }
  }
  cleanupWorkflowStreams(t) {
    const e = this.nodeDataStreams.get(t);
    if (e) {
      for (const r of e.values())
        this.streamEngine.closeConnection(r);
      this.nodeDataStreams.delete(t);
    }
  }
  collectNodeInputs(t, e) {
    return {};
  }
  async forwardDataToConnectedNodes(t, e, r, i) {
    const o = this.nodeDataStreams.get(t);
    if (o)
      for (const [s, a] of o) {
        const c = this.streamEngine.getConnection(a);
        if (c && c.sourceNodeId === e && c.sourcePort === r) {
          const u = {
            id: `${e}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            sourceNodeId: e,
            targetNodeId: c.targetNodeId,
            port: r,
            data: i,
            metadata: { workflowId: t, edgeId: s }
          };
          try {
            await c.writer.write(u);
          } catch (f) {
            console.error(`Failed to forward data from ${e}:${r}:`, f);
          }
        }
      }
  }
  destroy() {
    for (const [t, e] of this.runningWorkflows)
      e.abort(), this.cleanupWorkflowStreams(t);
    this.runningWorkflows.clear(), this.streamEngine.destroy();
  }
}
export {
  nt as A,
  _e as B,
  et as D,
  tt as G,
  D as S,
  ot as W,
  g as _,
  Xe as a,
  it as b,
  ie as d,
  J as s
};
