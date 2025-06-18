export var WidgetLifecycle;
(function (WidgetLifecycle) {
    WidgetLifecycle["INITIALIZING"] = "initializing";
    WidgetLifecycle["MOUNTING"] = "mounting";
    WidgetLifecycle["ACTIVE"] = "active";
    WidgetLifecycle["UPDATING"] = "updating";
    WidgetLifecycle["PAUSED"] = "paused";
    WidgetLifecycle["DESTROYING"] = "destroying";
    WidgetLifecycle["DESTROYED"] = "destroyed";
})(WidgetLifecycle || (WidgetLifecycle = {}));
export var WidgetEventType;
(function (WidgetEventType) {
    WidgetEventType["CLICK"] = "click";
    WidgetEventType["CHANGE"] = "change";
    WidgetEventType["SUBMIT"] = "submit";
    WidgetEventType["SELECT"] = "select";
    WidgetEventType["HOVER"] = "hover";
    WidgetEventType["FOCUS"] = "focus";
    WidgetEventType["BLUR"] = "blur";
    WidgetEventType["RESIZE"] = "resize";
    WidgetEventType["MOVE"] = "move";
    WidgetEventType["CUSTOM"] = "custom";
})(WidgetEventType || (WidgetEventType = {}));
