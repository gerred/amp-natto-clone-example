var s = Object.defineProperty;
var t = (n, e, o) => e in n ? s(n, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : n[e] = o;
var r = (n, e, o) => t(n, typeof e != "symbol" ? e + "" : e, o);
import * as i from "comlink";
import { W as a } from "./WorkflowEngine-CyxdCq6u.js";
class f {
  constructor() {
    r(this, "engine", new a());
  }
  async executeWorkflow(e) {
    return this.engine.executeWorkflow(e);
  }
  async stopWorkflow(e) {
    this.engine.stopWorkflow(e);
  }
  async getStatus() {
    return { running: [] };
  }
}
i.expose(new f());
