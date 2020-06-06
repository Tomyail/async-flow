import _ from 'lodash'
import { combineLatest, concat, defer, ObservableInput, of } from 'rxjs'
import { map, mergeMap, reduce } from 'rxjs/operators'

// https://stackblitz.com/edit/jo3dq1-c3kppz?file=index.ts
interface FlowConfig<T> {
  name: string
  flow: (context) => ObservableInput<T>
  map?: (result, context) => any
  children?:
  | FlowConfig<T>[]
  | {
    [key: string]: FlowConfig<T>
  }
}
export const buildFlow = <T>(
  context,
  flowConfigs: FlowConfig<T>[] | { [key: string]: FlowConfig<T> } | FlowConfig<T>
) => {
  if (_.isArray(flowConfigs)) {
    // @ts-ignore
    return flowArray(context, flowConfigs)
  } else {
    // if (flowConfigs['flow']) {
    //    // @ts-ignore
    //   return flowOne(context, flowConfigs).pipe(map(item=>{
    //     context[flowConfigs['name']] = item
    //     return context;
    //   }))
    // }
    // @ts-ignore
    return flowMap(context, flowConfigs)
  }
}

const flowArray = <T>(context, flows: FlowConfig<T>[]) => {
  return concat(...flows.map(flow => flowOne(context, flow))).pipe(reduce(() => context, context))
}

const flowMap = <T>(context: any, flows: { [key: string]: FlowConfig<T> }) => {
  /* tslint:disable */
  return combineLatest(
    ...Object.keys(flows)
      .map(key => {
        if (flows[key].name !== key) {
          throw new Error("flowConfig's key must save to name")
        }
        return key
      })
      .map(key => {
        const config = flows[key]
        return flowOne(context, config)
      })
  ).pipe(
    map(item => {
      return context
    })
  )
}
const flowOne = <T>(context, config: FlowConfig<T>) => {
  return defer(() => config.flow(context)).pipe(
    mergeMap(result => {
      context[config.name] = config.map ? config.map(result, context) : result
      if (config.children) {
        return buildFlow(context, config.children)
      }
      return of(context[config.name])
    }),
    map(result => {
      return result
    })
  )
}
