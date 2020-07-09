import { loopFetch } from '../src/loop-fetch'
import { defer } from 'rxjs'
import { TestScheduler } from 'rxjs/testing'
describe('loop fetch test', () => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })
  const makeSuccessPromise = () => {
    let callTime = 0

    return () => {
      if (callTime === 3) {
        return Promise.resolve('ok')
      } else {
        callTime++
        return Promise.resolve('pending')
      }
    }
  }

  const makePendingPromise = () => {
    let callTime = 0

    return () => {
      return Promise.resolve('pending')
    }
  }

  const makeErrorPromise = () => {
    return () => {
      return Promise.reject('error')
    }
  }

  it('test with retry', () => {
    testScheduler.run((helpers) => {
      const { cold, expectObservable, expectSubscriptions } = helpers;

      const e1 = cold('')
    })
    let retryTime = 0
    const promise = makeSuccessPromise()
    loopFetch(
      () => defer(() => promise()),
      (data) => {
        retryTime++
        return data === 'pending'
      },
      200,
      0
    ).subscribe((x) => {
      expect(x).toBe('ok')
      //3 time retry and 1 time success
      expect(retryTime).toBe(3 + 1)
    })
  })

  it('test with timeout', () => {
    let retryTime = 0
    const promise = makePendingPromise()
    loopFetch(
      () => defer(() => promise()),
      (data) => {
        retryTime++
        return data === 'pending'
      },
      200,
      0
    ).subscribe((x) => {
      expect(x).toBe('timeout')
      //todo 如何测试重试次数..
    })
  })

  //todo
  it.skip('test with error', () => {
    let retryTime = 0
    const promise = makeErrorPromise()
    loopFetch(
      () => defer(() => promise()),
      (data) => {
        retryTime++
        return data === 'pending'
      },
      2001,
      1000
    ).subscribe((x) => {
      expect(x).toBe('timeout')
      //todo 如何测试重试次数..
    })
  })
})
