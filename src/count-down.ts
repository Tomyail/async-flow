import { interval, Observable } from 'rxjs'
import { timestamp, pairwise, map, scan } from 'rxjs/operators'

/**
 * 就算掉帧也能保证倒计时准确
 * @param time 总时间(ms)
 * @param inter 倒计时间隔
 */
export const countDown = (time: number, inter = 500) => {
  return new Observable((sub) => {
    const timer$ = interval(inter).pipe(
      timestamp(),
      pairwise(),
      map(([a, b]) => {
        return b.timestamp - a.timestamp
      }),
      scan((acc, cur) => acc - cur, time),
      map((v) => {
        if (v > 0) {
          sub.next(v)
        } else {
          sub.complete()
        }
      })
    )

    const subs = timer$.subscribe()
    return () => {
      subs.unsubscribe()
    }
  })
}
