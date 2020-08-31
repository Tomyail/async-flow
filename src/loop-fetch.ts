import isFunction from 'lodash/isFunction'
import { defer, iif, Observable, of, race, timer } from 'rxjs'
import { delay, expand, first, mapTo, skipWhile, take } from 'rxjs/operators'
/**
 * 寻轮某个接口,当其返回特定的值后,停止轮训
 * @param input 主要的异步逻辑
 * @param conditionFn 如果返回值是 true,这次的结果会被忽略,否则取相关的值
 * @param time 超时时间,当这个时间到达之后,直接返回 timeout
 * @param delayTime 如果当前的请求没有成功,延迟多久后重试
 */
export const loopFetch = <T>(
  input: () => Observable<T>,
  conditionFn: (result: T) => boolean,
  time: number = 0,
  delayTime: (() => number) | number = 0
) => {
  const loop$ = defer(() => input()).pipe(
    expand((v) => {
      return iif(
        () => conditionFn(v),
        defer(() => input()),
        defer(() => of(v))
      ).pipe(delay(isFunction(delayTime) ? delayTime() : delayTime))
    }),
    skipWhile(conditionFn),
    take(1)
  )

  return iif(() => time > 0, race(timer(time).pipe(mapTo('timeout')), loop$).pipe(first()), loop$)
}
