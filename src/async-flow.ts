import _ from "lodash";
import { combineLatest, concat, defer, ObservableInput } from "rxjs";
import { map, mergeMap, reduce } from "rxjs/operators";

interface FlowConfig<T> {
  name: string;
  flow: () => ObservableInput<T>;
  map: (result, context) => any;
  children?:
  | FlowConfig<T>[]
  | {
    [key: string]: FlowConfig<T>;
  };
}
export const flow = <T>(
  context,
  flowConfigs: FlowConfig<T>[] | { [key: string]: FlowConfig<T> }
) => {
  if (_.isArray(flowConfigs)) {
    //@ts-ignore
    return flowArray(context, flowConfigs);
  } else {
    //@ts-ignore
    return flowMap(context, flowConfigs);
  }
};

const flowArray = <T>(context, flows: FlowConfig<T>[]) => {
  return concat(...flows.map(flow => flowOne(context, flow))).pipe(
    reduce(() => context, context)
  );
};

const flowMap = <T>(context: any, flows: { [key: string]: FlowConfig<T> }) => {
  return combineLatest(
    ...Object.keys(flows)
      .map(key => {
        if (flows[key].name !== key) {
          throw new Error("flowConfig's key must save to name");
        }
        return key;
      })
      .map(key => {
        const config = flows[key];
        return flowOne(context, config);
      })
  ).pipe(
    map(item => {
      return item;
    })
  );
};
const flowOne = <T>(context, config: FlowConfig<T>) => {
  return defer(config.flow).pipe(
    mergeMap(result => {
      context[config.name] = config.map(result, context);
      if (config.children) {
        return flow(
          context,
          config.children
        );
      }
      return [];
    }),
    map(result => {
      return context;
    })
  );
};

