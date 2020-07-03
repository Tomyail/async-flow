import { defer, from, timer, Observable, NEVER } from 'rxjs'
import { retryWhen, tap, filter, mergeMap, delayWhen, catchError } from 'rxjs/operators'
interface RetryConfig {
  /**
   * 错误过滤函数,只有返回是 true 的错误才会进入错误重试流程
   */
  errorFilter?: (error) => boolean
  /**
   * 当开始错误重试时,可以执行的钩子函数
   */
  onError?: (error) => void
  /**
   * 当 conditionPromiseFn resolve 之后,立刻执行的钩子函数
   */
  onRetry?: (error) => void
}
/**
 * @param promiseFn 主要异步逻辑,异常会触发重试
 * @param conditionPromiseFn promiseFn 触发异常后,这个函数resolve 会触发重试,否则不重试
 * @param config
 */
export const retry = <T extends any, M extends RetryConfig>(
  promiseFn: () => Promise<T> | Observable<T>,
  conditionPromiseFn: (error, config) => Promise<void>,
  config?: M
) => {
  const cfg = config
  return from(defer(promiseFn)).pipe(
    retryWhen((e) => {
      return e.pipe(
        tap((err) => {
          cfg?.onError?.call(null, err)
        }),
        filter((err) => {
          return cfg?.errorFilter?.call(null, err) ?? true
        }),
        mergeMap((err) => from(defer(() => conditionPromiseFn(err, cfg)))),
        tap((err) => {
          cfg?.onRetry?.call(null, err)
        }),
        delayWhen(() => timer(200))
      )
    }),
    //用户点击了取消
    catchError((e) => {
      return NEVER
    })
  )
}
