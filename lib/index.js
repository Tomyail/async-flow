"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
exports.flow = function (context, flowConfigs) {
    if (lodash_1.default.isArray(flowConfigs)) {
        //@ts-ignore
        return flowArray(context, flowConfigs);
    }
    else {
        //@ts-ignore
        return flowMap(context, flowConfigs);
    }
};
var flowArray = function (context, flows) {
    return rxjs_1.concat.apply(void 0, flows.map(function (flow) { return flowOne(context, flow); })).pipe(operators_1.reduce(function () { return context; }, context));
};
var flowMap = function (context, flows) {
    return rxjs_1.combineLatest.apply(void 0, Object.keys(flows)
        .map(function (key) {
        if (flows[key].name !== key) {
            throw new Error("flowConfig's key must save to name");
        }
        return key;
    })
        .map(function (key) {
        var config = flows[key];
        return flowOne(context, config);
    })).pipe(operators_1.map(function (item) {
        return item;
    }));
};
var flowOne = function (context, config) {
    return rxjs_1.defer(config.flow).pipe(operators_1.mergeMap(function (result) {
        context[config.name] = config.map(result, context);
        if (config.children) {
            return exports.flow(context, config.children);
        }
        return [];
    }), operators_1.map(function (result) {
        return context;
    }));
};
