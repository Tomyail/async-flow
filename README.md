# Async Flow

[![Build Status](https://travis-ci.org/Tomyail/async-flow.svg?branch=master)](https://travis-ci.org/Tomyail/async-flow)
[![Coveralls](https://coveralls.io/repos/github/Tomyail/async-flow/badge.svg)](https://coveralls.io/github/Tomyail/async-flow)
[![Dev Dependencies](https://david-dm.org/alexjoverm/typescript-library-starter/dev-status.svg)](https://david-dm.org/alexjoverm/typescript-library-starter?type=dev)


async-flow 是一个基于 [rxjs](https://rxjs-dev.firebaseapp.com/)的异步逻辑处理库.它的目的是用一种声明式的方式定义异步逻辑,并且尽可能的隐藏 rxjs 操作符的复杂性.

## 概念


### flow

### context

初始值是 buildFlow 的第一个参数,后续每个 flow 执行完毕后将其结果放置在 context 上. 后面的 flow 有能力访问到之前 flow 产生的结果.

### flowConfig

flow 使用 flowConfig 来定义一个异步逻辑,一个 flowConfig 是一个包含如下字段的对象:

* name(必填): string 这个异步逻辑的名称,执行完毕后将结果注入到 context
* flow(必填): (context)=> Promise|flow|Observable 这个异步逻辑的主体
* map(可选): (result,context) => result 
* children(可选) : 子 flow(参考下面的例子)


## 如何使用


### 基本用法


定义 `flowConfig` 之后,使用 `buildFlow` 创建 flow. 之后调用 `flow.subscribe`订阅 flow 的结果.

```JavaScript

// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=basic-usage.ts

import { buildFlow } from "./async-flow";
// basic usage
const flowConfig = {
  //flow 的名称
  name: "asyncTask1",
  //异步逻辑
  flow: context => {
    return Promise.resolve(1);
  }
};
//build async flow
const asyncFlow = buildFlow({}, [flowConfig]);

//运行 flow
asyncFlow.subscribe(context => {
  console.log(context);
  // {
  //   asyncTask1: 1
  // }
});

```

### 数据转换

flowConfig 的 map 方法可以用来处理 flow 异步响应后的逻辑.通常在这里编写一些数据转换逻辑(比如把 server 返回的 jsonapi 数据做一次预处理)

以下例子在上一个例子的基础上对返回结果做了一次+100 的操作.

```JavaScript

// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=basic_usage_with_map.ts

import { buildFlow } from "./async-flow";
// basic usage
const flowConfig = {
  //flow 的名称
  name: "asyncTask1",
  //异步逻辑
  flow: context => {
    return Promise.resolve(1);
  },
  //将 flow 的结果+100
  map: (result, context) => result + 100
};
//build async flow
const asyncFlow = buildFlow({}, [flowConfig]);

//运行 flowb
asyncFlow.subscribe(context => {
  console.log(context);
  // {
  //   asyncTask1: 101
  // }
});

```

### 定义队列 flow

如果 `buildFlow` 的第二个参数是 flowConfig 数组,那么数组里面的每一项将按照数组的先后次序依次执行.后执行的异步逻辑可以通过 context 拿到它之前异步逻辑的结果.

```JavaScript
// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=queue_flow.ts
import { buildFlow } from "./async-flow";
// basic usage
const asyncTask1 = {
  //flow 的名称
  name: "asyncTask1",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask1");
  }
};

const asyncTask2 = {
  //flow 的名称
  name: "asyncTask2",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask2" + context.asyncTask1);
  }
};
//build async flow
const asyncFlow = buildFlow({}, [asyncTask1,asyncTask2]);

//运行 flowbb
asyncFlow.subscribe(context => {
  console.log(context);
  // {asyncTask1: "asyncTask1", asyncTask2: "asyncTask2asyncTask1"}
});

```
### 定义并行 flow

当 `buildFlow` 的第二个参数是 flowConfig 对象时. 这个对象的每一项都会并行执行.
所以相邻的异步逻辑无法获取其他异步逻辑的结果. 并行定义 flow 时,flowConfig 哈希的每一项的 key 必须和 flowConfig 的 name 一致,否则会报错.

```
// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=parallel_flow.ts
import { buildFlow } from "./async-flow";
// basic usage
const asyncTask1 = {
  //flow 的名称
  name: "asyncTask1",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask1");
  }
};

const asyncTask2 = {
  //flow 的名称
  name: "asyncTask2",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask2" + context.asyncTask1);
  }
};
//build async flow
const asyncFlow = buildFlow({}, { asyncTask1, asyncTask2 });

//运行 flowbb
asyncFlow.subscribe(context => {
  console.log(context);
  // {asyncTask1: "asyncTask1", asyncTask2: "asyncTask2undefined"}
});

```


### 子 flow

每个 flowConfig 可以定义 children 属性,其类型可以是数组或者flowConfig 哈希.在其父异步逻辑执行完毕后,将会执行 children flow.

```

// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=children_flow.ts
import { buildFlow } from "./async-flow";
// basic usage
const asyncTask1 = {
  //flow 的名称
  name: "asyncTask1",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask1");
  },
  children: [
    {
      name: "asyncTask1_child1", //异步逻辑
      flow: context => {
        return Promise.resolve("this is asyncTask1_child1");
      }
    },
    {
      name: "asyncTask1_child2", //异步逻辑
      flow: context => {
        return Promise.resolve(
          "this is asyncTask1_child2" + context.asyncTask1_child1
        );
      }
    }
  ]
};

const asyncTask2 = {
  //flow 的名称
  name: "asyncTask2",
  //异步逻辑
  flow: context => {
    return Promise.resolve("asyncTask2" + context.asyncTask1);
  },
  children: {
    asyncTask2_child1: {
      name: "asyncTask2_child1", //异步逻辑
      flow: context => {
        return Promise.resolve("this is asyncTask2_child1");
      }
    },
    asyncTask2_child2: {
      name: "asyncTask2_child2", //异步逻辑
      flow: context => {
        return Promise.resolve(
          "this is asyncTask2_child2" + context.asyncTask1_child1
        );
      }
    }
  }
};
//build async flow
const asyncFlow = buildFlow({}, { asyncTask1, asyncTask2 });

//运行 flowbb
asyncFlow.subscribe(context => {
  console.log(context);
  // {
  //   asyncTask1: "asyncTask1";
  //   asyncTask1_child1: "this is asyncTask1_child1";
  //   asyncTask1_child2: "this is asyncTask1_child2this is asyncTask1_child1";
  //   asyncTask2: "asyncTask2undefined";
  //   asyncTask2_child1: "this is asyncTask2_child1";
  //   asyncTask2_child2: "this is asyncTask2_child2undefined";
  // }
});

```

### flow 嵌套


flowConfig 里面的 flow 的返回值不仅仅可以是 promise,它还可以是其他 [Observable](https://rxjs-dev.firebaseapp.com/guide/observable). 由于 buildFlow 本身就会产生一个 Observable,所以可以嵌套使用. 嵌套使用的时候 context 不会被打平.
```

// 在线预览地址(将 index 文件替换为此文件): https://stackblitz.com/edit/ypzuhr-lkli1h?file=nest_flow.ts
import { buildFlow } from "./async-flow";

const childFlowConfig = {
  //flow 的名称
  name: "childFlowConfig",
  //异步逻辑
  flow: context => {
    return Promise.resolve(1);
  }
};

const childFlow = buildFlow({}, [childFlowConfig]);

// basic usage
const parentFlowConfig1 = {
  //flow 的名称
  name: "parentFlowConfig1",
  //异步逻辑
  flow: context => {
    return childFlow;
  }
};

const parentFlowConfig2 = {
  //flow 的名称
  name: "parentFlowConfig2",
  //异步逻辑
  flow: context => {
    return Promise.resolve(2);
  }
};

const asyncFlow = buildFlow({}, [parentFlowConfig1, parentFlowConfig2]);

asyncFlow.subscribe(context => {
  console.log(context);
  // {
  //   parentFlowConfig1: {
  //     childFlowConfig: 1;
  //   }
  //   parentFlowConfig2: 2;
  // }
});

```

