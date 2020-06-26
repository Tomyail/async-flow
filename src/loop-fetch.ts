import isFunction from 'lodash/isFunction'
import { EMPTY, Observable, race, timer } from 'rxjs'
import { delay, expand, first, mapTo, skip, skipWhile, startWith } from 'rxjs/operators'
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
  time: number,
  delayTime: (() => number) | number
) => {
  const loop$ = EMPTY.pipe(
    startWith({}),
    expand((v) => {
      return input().pipe(delay(isFunction(delayTime) ? delayTime() : delayTime))
    }),
    // 第一个值是 startWith 的默认值,不用传给conditionFn,所以忽略
    skip(1),
    skipWhile(conditionFn),
    first()
  )

  const timeout$ = timer(time).pipe(mapTo<number, 'timeout'>('timeout'))

  return race(timeout$, loop$).pipe(first())
}
